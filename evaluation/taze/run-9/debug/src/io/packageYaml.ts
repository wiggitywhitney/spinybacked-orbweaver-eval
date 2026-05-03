import { trace, SpanStatusCode } from '@opentelemetry/api'
import type { Document as DocumentType } from 'yaml'
import type { CommonOptions, DepType, PackageMeta, RawDep } from '../types'
import * as fs from 'node:fs/promises'
import detectIndent from 'detect-indent'
import { resolve } from 'pathe'
import { Document, parseDocument as parseYaml, stringify as stringifyYaml } from 'yaml'
import { builtinAddons } from '../addons'
import { dumpDependencies, getByPath, parseDependencies, parseDependency } from './dependencies'

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
  return key === 'peerDependencies' ? !!options.peer : options.depFields?.[key] !== false
}

export async function readYAML(filepath: string): Promise<DocumentType> {
  return tracer.startActiveSpan('taze.package_yaml.read', async (span) => {
    try {
      span.setAttribute('taze.write.file_path', filepath)
      const content = await fs.readFile(filepath, 'utf-8')
      if (!content)
        return new Document({})

      const document = parseYaml(content, { merge: true })
      const parsed = document.toJS()

      if (document.errors.length || typeof parsed !== 'object' || Array.isArray(parsed))
        throw new TypeError(`Invalid package.yaml structure in ${filepath}`)

      return document
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      span.setStatus({ code: SpanStatusCode.ERROR })
      throw error
    } finally {
      span.end()
    }
  })
}

export async function writeYAML(filepath: string, data: DocumentType | Record<string, unknown>) {
  return tracer.startActiveSpan('taze.package_yaml.write', async (span) => {
    try {
      span.setAttribute('taze.write.file_path', filepath)
      const { amount, type } = await fs.readFile(filepath, 'utf-8')
        .then(detectIndent)
        .catch(Object.create)

      const indent = (type === 'tab' ? 2 : amount) ?? 2

      const yamlContent = stringifyYaml(data, {
        indent,
        aliasDuplicateObjects: false,
        lineWidth: 0,
      }).replace(/^(\s*)"(@[^":]+)":/gm, `$1'$2':`)

      return fs.writeFile(filepath, yamlContent, 'utf-8')
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      span.setStatus({ code: SpanStatusCode.ERROR })
      throw error
    } finally {
      span.end()
    }
  })
}

export async function loadPackageYAML(
  relative: string,
  options: CommonOptions,
  shouldUpdate: (name: string) => boolean,
): Promise<PackageMeta[]> {
  return tracer.startActiveSpan('taze.package_yaml.load', async (span) => {
    try {
      const filepath = resolve(options.cwd ?? '', relative)
      span.setAttribute('taze.write.file_path', filepath)
      const doc = await readYAML(filepath)
      const deps: RawDep[] = []

      for (const key of allDepsFields) {
        if (!isDepFieldEnabled(key, options))
          continue

        if (key === 'packageManager') {
          const packageManager = doc.get(key)
          if (typeof packageManager === 'string') {
            const [name, version] = packageManager.split('@')
            // `+` sign can be used to pin the hash of the package manager, we remove it to be semver compatible.
            deps.push(parseDependency({ name, version: `^${version.split('+')[0]}`, type: 'packageManager', shouldUpdate }))
          }
        }
        else {
          deps.push(...parseDependencies(doc.toJS(), key, shouldUpdate))
        }
      }

      span.setAttribute('taze.check.packages_total', deps.length)
      return [
        {
          name: doc.get('name') as string ?? '',
          private: !!doc.get('private'),
          version: doc.get('version') as string ?? '',
          type: 'package.yaml',
          relative,
          filepath,
          get raw() {
            return doc.toJS()
          },
          deps,
          yamlDocument: doc,
          resolved: [],
        },
      ]
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      span.setStatus({ code: SpanStatusCode.ERROR })
      throw error
    } finally {
      span.end()
    }
  })
}

export async function writePackageYAML(
  pkg: PackageMeta,
  options: CommonOptions,
) {
  return tracer.startActiveSpan('taze.package_yaml.write_package', async (span) => {
    try {
      let changed = false

      if (pkg.type !== 'package.yaml') {
        throw new Error('Package type is not supported')
      }

      span.setAttribute('taze.write.file_path', pkg.filepath)
      span.setAttribute('taze.write.package_type', pkg.type)

      const doc = pkg.yamlDocument || new Document(pkg.raw)

      for (const key of allDepsFields) {
        if (!isDepFieldEnabled(key, options))
          continue

        if (key === 'packageManager') {
          const [value] = Object.entries(dumpDependencies(pkg.resolved, 'packageManager'))
          if (value) {
            doc.set('packageManager', `${value[0]}@${value[1].replace('^', '')}`)
            changed = true
          }
        }
        else {
          if (getByPath(doc.toJS(), key)) {
            const values = Object.entries(dumpDependencies(pkg.resolved, key))
            values.forEach(([lastKey, value]) =>
              doc.setIn([...key.split('.'), lastKey], value))
            changed = true
          }
        }
      }

      if (changed) {
        for (const addon of (options.addons || builtinAddons)) {
          await addon.beforeWrite?.(pkg, options)
        }
        await writeYAML(pkg.filepath, doc)
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
