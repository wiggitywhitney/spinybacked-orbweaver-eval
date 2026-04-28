import { trace, SpanStatusCode } from '@opentelemetry/api'
import type { CheckOptions, DependencyFilter, DependencyResolvedCallback, PackageMeta, RawDep } from '../types'
import { newQueue } from '@henrygd/queue'
import { loadPackages, writePackage } from '../io/packages'
import { dumpCache, loadCache, resolvePackage } from '../io/resolves'
import { queueContext } from '../utils/context'

const tracer = trace.getTracer('taze')

export interface CheckEventCallbacks {
  afterPackagesLoaded?: (pkgs: PackageMeta[]) => void
  beforePackageStart?: (pkg: PackageMeta) => void
  afterPackageEnd?: (pkg: PackageMeta) => void
  beforePackageWrite?: (pkg: PackageMeta) => boolean | Promise<boolean>
  afterPackagesEnd?: (pkgs: PackageMeta[]) => void
  afterPackageWrite?: (pkg: PackageMeta) => void
  onDependencyResolved?: DependencyResolvedCallback
}

export async function CheckPackages(options: CheckOptions, callbacks: CheckEventCallbacks = {}) {
  return tracer.startActiveSpan('taze.check', async (span) => {
    try {
      if (!options.force)
        await loadCache()

      // packages loading
      const packages = await loadPackages(options)
      callbacks.afterPackagesLoaded?.(packages)

      const privatePackageNames = packages
        .filter(i => i.private)
        .map(i => i.name)
        .filter(i => i)

      // to filter out private dependency in monorepo
      const filter = (dep: RawDep) => !privatePackageNames.includes(dep.name)

      let resolvedCount = 0
      const onDependencyResolved: DependencyResolvedCallback = (pkgName, name, progress, total) => {
        resolvedCount++
        callbacks.onDependencyResolved?.(pkgName, name, resolvedCount, total)
      }

      const queue = newQueue(options.concurrency || 10)

      await queueContext.run(queue, () => {
        // run all CheckSingleProject in parallel
        // the actual resolveDependencies within CheckSingleProject -> resolvePackage -> resolveDependencies is
        // actually limited by the queueContext/queue, so it won't overwhelm the npm meta server.
        return Promise.all(packages.map(async (pkg) => {
          callbacks.beforePackageStart?.(pkg)
          await CheckSingleProject(pkg, options, filter, { ...callbacks, onDependencyResolved })
          callbacks.afterPackageEnd?.(pkg)
        }))
      })

      callbacks.afterPackagesEnd?.(packages)

      await dumpCache()

      span.setAttribute('taze.check.packages_total', packages.reduce((acc, pkg) => acc + (pkg.resolved?.length ?? 0), 0))
      span.setAttribute('taze.check.packages_outdated', packages.reduce((acc, pkg) => acc + (pkg.resolved?.filter(i => i.update)?.length ?? 0), 0))

      return {
        packages,
      }
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      span.setStatus({ code: SpanStatusCode.ERROR })
      throw error
    } finally {
      span.end()
    }
  })
}

async function CheckSingleProject(pkg: PackageMeta, options: CheckOptions, filter: DependencyFilter = () => true, callbacks: CheckEventCallbacks = {}) {
  await resolvePackage(pkg, options, filter, callbacks.onDependencyResolved)

  const { resolved } = pkg
  const changes = resolved.filter(i => i.update)

  if (options.write && changes.length) {
    const shouldWrite = await Promise.resolve(callbacks.beforePackageWrite?.(pkg))

    if (shouldWrite !== false) {
      await writePackage(pkg, options)
      callbacks.afterPackageWrite?.(pkg)
    }
  }
  return pkg
}
