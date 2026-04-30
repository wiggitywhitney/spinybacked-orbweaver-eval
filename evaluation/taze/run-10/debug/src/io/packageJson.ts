import { trace, SpanStatusCode } from '@opentelemetry/api'
import type { CommonOptions, DepType, PackageMeta, RawDep } from '../types'
import { resolve } from 'pathe'
import { builtinAddons } from '../addons'
import { getHexHashFromIntegrity } from '../utils/sha'
import { dumpDependencies, getByPath, parseDependencies, parseDependency, setByPath } from './dependencies'
import { readJSON, writeJSON } from './packages'

const tracer = trace.getTracer('taze')

const allDepsFields = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
  'packageManager',
  'pnpm.overrides',
  'resolutions',
  'overrides',
] as const satisfies DepType[]

function isDepFieldEnabled(key: DepType, options: CommonOptions): boolean {
  if (options.depFields?.[key] === false)
    return false
  if (key === 'peerDependencies')
    return !!options.peer
  return true
}

export async function loadPackageJSON(
  relative: string,
  options: CommonOptions,
  shouldUpdate: (name: string) => boolean,
  existingRaw?: Record<string, unknown>,
): Promise<PackageMeta[]> {
  return tracer.startActiveSpan('taze.package.load', async (span) => {
    try {
      const filepath = resolve(options.cwd ?? '', relative)
      const raw: Record<string, any> = existingRaw ?? await readJSON(filepath)
      const deps: RawDep[] = []

      for (const key of allDepsFields) {
        if (!isDepFieldEnabled(key, options))
          continue

        if (key === 'packageManager') {
          if (raw.packageManager) {
            const [name, versionWithHash] = raw.packageManager.split('@')
            // `+` sign can be used to pin the hash of the package manager, we remove it to be semver compatible.
            const [version, hashPart] = versionWithHash.split('+')
            const hexHash = hashPart?.split('.')[1]
            deps.push(parseDependency({ name, version: `^${version}`, type: 'packageManager', shouldUpdate, hexHash }))
          }
        }
        else {
          deps.push(...parseDependencies(raw, key, shouldUpdate))
        }
      }

      span.setAttribute('taze.write.file_path', filepath)
      if (raw.name != null) {
        span.setAttribute('taze.package.name', String(raw.name))
      }

      return [
        {
          name: raw.name,
          private: !!raw.private,
          version: raw.version,
          type: 'package.json' as const,
          relative,
          filepath,
          raw,
          deps,
          resolved: [],
        },
      ]
    }
    catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      span.setStatus({ code: SpanStatusCode.ERROR })
      throw error
    }
    finally {
      span.end()
    }
  })
}

export async function writePackageJSON(
  pkg: PackageMeta,
  options: CommonOptions,
) {
  return tracer.startActiveSpan('taze.package.write', async (span) => {
    try {
      span.setAttribute('taze.write.file_path', pkg.filepath)
      span.setAttribute('taze.write.package_type', 'package.json')

      let changed = false

      for (const key of allDepsFields) {
        if (!isDepFieldEnabled(key, options))
          continue

        if (key === 'packageManager') {
          const value = Object.entries(dumpDependencies(pkg.resolved, 'packageManager'))[0]
          if (value) {
            pkg.raw ||= {}
            const [name, versionWithCaret] = value
            const version = versionWithCaret.replace('^', '')
            let packageManagerValue = `${name}@${version}`

            const resolvedDep = pkg.resolved.find(dep => dep.source === 'packageManager' && dep.name === name)
            if (resolvedDep?.hexHash) {
              const integrity = resolvedDep.pkgData.integrity?.[version]
              if (integrity) {
                const newHexHash = getHexHashFromIntegrity(integrity)
                packageManagerValue = `${packageManagerValue}+sha512.${newHexHash}`
              }
            }

            pkg.raw.packageManager = packageManagerValue
            changed = true
          }
        }
        else {
          if (getByPath(pkg.raw, key)) {
            setByPath(pkg.raw, key, dumpDependencies(pkg.resolved, key))
            changed = true
          }
        }
      }

      if (changed) {
        for (const addon of (options.addons || builtinAddons)) {
          await addon.beforeWrite?.(pkg, options)
        }
        await writeJSON(pkg.filepath, pkg.raw || {})
      }
    }
    catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      span.setStatus({ code: SpanStatusCode.ERROR })
      throw error
    }
    finally {
      span.end()
    }
  })
}
