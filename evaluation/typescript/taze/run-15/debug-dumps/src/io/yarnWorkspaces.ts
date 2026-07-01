import { trace, SpanStatusCode } from '@opentelemetry/api'
import type { PnpmWorkspaceYaml } from 'pnpm-workspace-yaml'
import type { CommonOptions, RawDep, YarnWorkspaceMeta } from '../types'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'pathe'
import { parsePnpmWorkspaceYaml } from 'pnpm-workspace-yaml'
import { dumpDependencies, parseDependency } from './dependencies'

const tracer = trace.getTracer('taze')

export async function loadYarnWorkspace(
  relative: string,
  options: CommonOptions,
  shouldUpdate: (name: string) => boolean,
): Promise<YarnWorkspaceMeta[]> {
  return tracer.startActiveSpan('taze.io.load_yarn_workspace', async (span) => {
    try {
      const filepath = resolve(options.cwd ?? '', relative)
      const rawText = await readFile(filepath, 'utf-8')
      const context = parsePnpmWorkspaceYaml(rawText)
      const raw = context.getDocument().toJSON()

      const catalogs: YarnWorkspaceMeta[] = []

      function createYarnWorkspaceEntry(name: string, map: Record<string, string>): YarnWorkspaceMeta {
        const deps: RawDep[] = Object.entries(map)
          .map(([pkg, version]) => parseDependency({ name: pkg, version, type: 'yarn-workspace', shouldUpdate }))

        return {
          name,
          private: true,
          version: '',
          type: '.yarnrc.yml',
          relative,
          filepath,
          raw,
          context,
          deps,
          resolved: [],
        } satisfies YarnWorkspaceMeta
      }

      if (raw?.catalog) {
        catalogs.push(
          createYarnWorkspaceEntry('yarn-catalog:default', raw.catalog),
        )
      }

      if (raw?.catalogs) {
        for (const key of Object.keys(raw.catalogs)) {
          catalogs.push(
            createYarnWorkspaceEntry(`yarn-catalog:${key}`, raw.catalogs[key]),
          )
        }
      }

      span.setAttribute('taze.write.file_path', filepath)
      span.setAttribute('taze.io.catalogs_found', String(catalogs.length))
      return catalogs
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      span.setStatus({ code: SpanStatusCode.ERROR })
      throw error
    } finally {
      span.end()
    }
  })
}

export async function writeYarnWorkspace(
  pkg: YarnWorkspaceMeta,
  _options: CommonOptions,
) {
  return tracer.startActiveSpan('taze.io.write_yarn_workspace', async (span) => {
    try {
      span.setAttribute('taze.package.name', pkg.name)
      span.setAttribute('taze.write.file_path', pkg.filepath)
      const versions = dumpDependencies(pkg.resolved, 'yarn-workspace')

      span.setAttribute('taze.write.changes_count', Object.keys(versions).length)
      if (!Object.keys(versions).length)
        return

      if (pkg.name.startsWith('yarn-catalog:')) {
        const catalogName = pkg.name.replace('yarn-catalog:', '')
        for (const [key, targetVersion] of Object.entries(versions)) {
          pkg.context.setPackage(catalogName, key, targetVersion)
        }
      }
      else {
        const paths = pkg.name.replace('yarn-workspace:', '').split(/\./ g)
        for (const [key, targetVersion] of Object.entries(versions)) {
          pkg.context.setPath([...paths, key], targetVersion)
        }
      }

      if (pkg.context.hasChanged()) {
        await writeYaml(pkg, pkg.context)
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

export function writeYaml(pkg: YarnWorkspaceMeta, document: PnpmWorkspaceYaml) {
  return writeFile(pkg.filepath, document.toString(), 'utf8')
}
