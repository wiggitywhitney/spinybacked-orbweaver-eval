import { trace, SpanStatusCode } from '@opentelemetry/api';
import path from 'node:path';
import semver from 'semver';
import urlJoin from 'url-join';
import Plugin from '../Plugin.js';
import { hasAccess, rejectAfter, parseVersion, readJSON, e, fixArgs, getNpmEnv } from '../../util.js';
import prompts from './prompts.js';

const docs = 'https://git.io/release-it-npm';

const getOptions = () => ({ write: false, env: getNpmEnv() });

const MANIFEST_PATH = './package.json';
const DEFAULT_TAG = 'latest';
const DEFAULT_TAG_PRERELEASE = 'next';
const NPM_BASE_URL = 'https://www.npmjs.com';
const NPM_PUBLIC_PATH = '/package';
const DEFAULT_TIMEOUT = 10;

const tracer = trace.getTracer('release-it');

class npm extends Plugin {
  static isEnabled(options) {
    return hasAccess(MANIFEST_PATH) && options !== false;
  }

  constructor(...args) {
    super(...args);
    this.registerPrompts(prompts);
  }

  async init() {
    return tracer.startActiveSpan('release_it.npm.init', async span => {
      try {
        const {
          name,
          version: latestVersion,
          private: isPrivate,
          publishConfig
        } = readJSON(path.resolve(MANIFEST_PATH));
        this.setContext({ name, latestVersion, private: isPrivate, publishConfig });
        this.config.setContext({ npm: { name } });

        if (name != null) {
          span.setAttribute('release_it.npm.package_name', name);
        }
        if (latestVersion != null) {
          span.setAttribute('release_it.version.current', latestVersion);
        }

        const { publish, skipChecks } = this.options;

        const timeout = Number(this.options.timeout ?? DEFAULT_TIMEOUT) * 1000;

        if (publish === false || isPrivate) return;

        if (skipChecks) return;

        const validations = Promise.all([this.isRegistryUp(), this.isAuthenticated(), this.getLatestRegistryVersion()]);

        await Promise.race([validations, rejectAfter(timeout, e(`Timed out after ${timeout}ms.`, docs))]);

        const [isRegistryUp, isAuthenticated, latestVersionInRegistry] = await validations;

        if (!isRegistryUp) {
          throw e(`Unable to reach npm registry (timed out after ${timeout}ms).`, docs);
        }

        if (!isAuthenticated) {
          throw e('Not authenticated with npm. Please `npm login` and try again.', docs);
        }

        if (!(await this.isCollaborator())) {
          const { username } = this.getContext();
          throw e(`User ${username} is not a collaborator for ${name}.`, docs);
        }

        if (!latestVersionInRegistry) {
          this.log.warn('No version found in npm registry. Assuming new package.');
        } else {
          if (!semver.eq(latestVersion, latestVersionInRegistry)) {
            this.log.warn(
              `Latest version in registry (${latestVersionInRegistry}) does not match package.json (${latestVersion}).`
            );
          }
        }
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  getName() {
    return this.getContext('name');
  }

  getLatestVersion() {
    return this.options.ignoreVersion ? null : this.getContext('latestVersion');
  }

  async bump(version) {
    return tracer.startActiveSpan('release_it.npm.bump', async span => {
      try {
        span.setAttribute('release_it.version.next', version);
        const tag = this.options.tag || (await this.resolveTag(version));
        this.setContext({ version, tag });
        span.setAttribute('release_it.npm.dist_tag', tag);

        if (!this.config.isIncrement) return false;

        const { versionArgs, allowSameVersion } = this.options;
        const args = [
          version,
          '--no-git-tag-version',
          '--workspaces=false',
          allowSameVersion && '--allow-same-version',
          ...fixArgs(versionArgs)
        ];
        const task = () =>
          this.exec(`npm version ${args.filter(Boolean).join(' ')}`, { options: { env: getNpmEnv() } });
        return await this.spinner.show({ task, label: 'npm version' });
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  release() {
    if (this.options.publish === false) return false;
    if (this.getContext('private')) return false;
    const publish = () => this.publish({ otpCallback });
    const otpCallback =
      this.config.isCI && !this.config.isPromptOnlyVersion ? null : task => this.step({ prompt: 'otp', task });
    return this.step({ task: publish, label: 'npm publish', prompt: 'publish' });
  }

  isRegistryUp() {
    const registry = this.getRegistry();
    const registryArg = registry ? ` --registry ${registry}` : '';
    return this.exec(`npm ping${registryArg}`, { options: getOptions() }).then(
      () => true,
      err => {
        if (/code E40[04]|404.*(ping not found|No content for path)/.test(err)) {
          this.log.warn('Ignoring response from unsupported `npm ping` command.');
          return true;
        }
        return false;
      }
    );
  }

  isAuthenticated() {
    const registry = this.getRegistry();
    const registryArg = registry ? ` --registry ${registry}` : '';
    return this.exec(`npm whoami${registryArg}`, { options: getOptions() }).then(
      output => {
        const username = output ? output.trim() : null;
        this.setContext({ username });
        return true;
      },
      err => {
        this.debug(err);
        if (/code E40[04]/.test(err)) {
          this.log.warn('Ignoring response from unsupported `npm whoami` command.');
          return true;
        }
        return false;
      }
    );
  }

  async isCollaborator() {
    return tracer.startActiveSpan('release_it.npm.is_collaborator', async span => {
      try {
        if (span.isRecording()) {
          span.setAttribute('release_it.npm.package_name', this.getName());
        }
        const registry = this.getRegistry();
        const registryArg = registry ? ` --registry ${registry}` : '';
        const name = this.getName();
        const { username } = this.getContext();
        if (username === undefined) return true;
        if (username === null) return false;

        try {
          let npmVersion = await this.exec('npm --version', { options: getOptions() });

          let accessCommand;
          if (semver.gt(npmVersion, '9.0.0')) {
            accessCommand = 'npm access list collaborators --json';
          } else {
            accessCommand = 'npm access ls-collaborators';
          }

          const output = await this.exec(`${accessCommand} ${name}${registryArg}`, { options: getOptions() });

          try {
            const collaborators = JSON.parse(output);
            const permissions = collaborators[username];
            return permissions && permissions.includes('write');
          } catch (err) {
            this.debug(err);
            return false;
          }
        } catch (err) {
          this.debug(err);
          if (/code E400/.test(err)) {
            this.log.warn('Ignoring response from unsupported `npm access` command.');
          } else {
            this.log.warn(`Unable to verify if user ${username} is a collaborator for ${name}.`);
          }
          return true;
        }
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  async getLatestRegistryVersion() {
    return tracer.startActiveSpan('release_it.npm.get_latest_registry_version', async span => {
      try {
        const registry = this.getRegistry();
        const registryArg = registry ? ` --registry ${registry}` : '';
        const name = this.getName();
        const latestVersion = this.getLatestVersion();
        const tag = await this.resolveTag(latestVersion);
        span.setAttribute('release_it.npm.package_name', name);
        span.setAttribute('release_it.npm.dist_tag', tag);
        if (registry != null) {
          span.setAttribute('release_it.npm.registry', registry);
        }
        return this.exec(`npm show ${name}@${tag} version${registryArg}`, { options: getOptions() }).catch(() => null);
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  getRegistryDistTags() {
    return this.exec(`npm view ${this.getName()} dist-tags --json`, { options: getOptions() }).then(
      output => {
        try {
          return JSON.parse(output);
        } catch (err) {
          this.debug(err);
          return {};
        }
      },
      () => ({})
    );
  }

  async getRegistryPreReleaseTags() {
    return tracer.startActiveSpan('release_it.npm.get_registry_pre_release_tags', async span => {
      try {
        const tags = await this.getRegistryDistTags();
        const result = Object.keys(tags).filter(tag => tag !== DEFAULT_TAG);
        span.setAttribute('release_it.npm.pre_release_tags_count', String(result.length));
        return result;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  getPackageUrl() {
    const baseUrl = this.getRegistry() || NPM_BASE_URL;
    const publicPath = this.getPublicPath() || NPM_PUBLIC_PATH;
    return urlJoin(baseUrl, publicPath, this.getName());
  }

  getRegistry() {
    const { publishConfig } = this.getContext();
    const registries = publishConfig
      ? publishConfig.registry
        ? [publishConfig.registry]
        : Object.keys(publishConfig)
            .filter(key => key.endsWith('registry'))
            .map(key => publishConfig[key])
      : [];
    return registries[0];
  }

  getPublicPath() {
    const { publishConfig } = this.getContext();
    return (publishConfig && publishConfig.publicPath) ?? '';
  }

  async guessPreReleaseTag() {
    return tracer.startActiveSpan('release_it.npm.guess_pre_release_tag', async span => {
      try {
        const distTags = await this.getRegistryDistTags();
        const latestVersion = this.getLatestVersion();
        if (latestVersion != null) {
          span.setAttribute('release_it.version.current', latestVersion);
        }
        const match = Object.entries(distTags).find(
          ([tag, version]) => tag !== DEFAULT_TAG && version === latestVersion
        );
        if (match) return match[0];

        const [tag] = Object.keys(distTags).filter(tag => tag !== DEFAULT_TAG);
        if (tag) return tag;

        this.log.warn(`Unable to get pre-release tag(s) from npm registry. Using "${DEFAULT_TAG_PRERELEASE}".`);
        return DEFAULT_TAG_PRERELEASE;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  async resolveTag(version) {
    return tracer.startActiveSpan('release_it.npm.resolve_tag', async span => {
      try {
        span.setAttribute('release_it.version.next', version);
        const { tag } = this.options;
        const { isPreRelease, preReleaseId } = parseVersion(version);
        if (!isPreRelease) {
          return DEFAULT_TAG;
        } else {
          return tag || preReleaseId || (await this.guessPreReleaseTag());
        }
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  async publish({ otp = this.options.otp, otpCallback } = {}) {
    return tracer.startActiveSpan('release_it.npm.publish', async span => {
      try {
        const publishPackageManager = this.options.publishPackageManager || 'npm';
        const { publishPath = '.', publishArgs } = this.options;
        const { private: isPrivate, tag = DEFAULT_TAG } = this.getContext();
        const otpArgs = otp ? ['--otp', otp] : [];
        const dryRunArg = this.config.isDryRun ? '--dry-run' : '';
        const registry = this.getRegistry();
        const registryArg = registry ? `--registry ${registry}` : '';
        span.setAttribute('release_it.npm.dist_tag', tag);
        span.setAttribute('release_it.is_dry_run', this.config.isDryRun);
        if (registry != null) {
          span.setAttribute('release_it.npm.registry', registry);
        }
        if (isPrivate) {
          this.log.warn('Skip publish: package is private.');
          return false;
        }
        const args = [
          publishPath,
          '--tag',
          tag,
          publishPackageManager === 'npm' && '--workspaces=false',
          ...otpArgs,
          dryRunArg,
          registryArg,
          ...fixArgs(publishArgs)
        ].filter(Boolean);
        const isInteractive = !this.config.isCI;
        return await this.exec([publishPackageManager, 'publish', ...args], {
          options: { ...getOptions(), interactive: isInteractive }
        })
          .then(() => {
            this.setContext({ isReleased: true });
            this.config.setContext({ isReleased: true });
          })
          .catch(err => {
            this.debug(err);
            if (this.config.isDryRun && /publish over the previously published version/.test(err)) {
              return Promise.resolve();
            }

            if (/one-time pass/.test(err)) {
              if (otp != null) {
                this.log.warn('The provided OTP is incorrect or has expired.');
              }
              if (otpCallback) {
                return otpCallback(otp => this.publish({ otp, otpCallback }));
              }
            }
            throw err;
          });
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  afterRelease() {
    const { isReleased } = this.getContext();
    if (isReleased) {
      this.log.log(`🔗 ${this.getPackageUrl()}`);
    }
  }
}

export default npm;
