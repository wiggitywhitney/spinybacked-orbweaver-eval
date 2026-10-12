import { trace, SpanStatusCode } from '@opentelemetry/api';
import { EOL } from 'node:os';
import { format, parseGitUrl } from '../util.js';
import Plugin from './Plugin.js';

const options = { write: false };
const changelogFallback = 'git log --pretty=format:"* %s (%h)"';
const tracer = trace.getTracer('release-it');

class GitBase extends Plugin {
  async init() {
    return tracer.startActiveSpan('release_it.git_base.init', async span => {
      try {
        const remoteUrl = await this.getRemoteUrl();
        await this.fetch(remoteUrl);

        const branchName = await this.getBranchName();
        const repo = parseGitUrl(remoteUrl);
        this.setContext({ remoteUrl, branchName, repo });
        this.config.setContext({ remoteUrl, branchName, repo });

        const latestTag = await this.getLatestTagName();
        const secondLatestTag = !this.config.isIncrement ? await this.getSecondLatestTagName(latestTag) : null;
        const tagTemplate = this.options.tagName || ((latestTag || '').match(/^v/) ? 'v${version}' : '${version}');
        this.config.setContext({ latestTag, secondLatestTag, tagTemplate });

        if (remoteUrl != null) {
          span.setAttribute('vcs.repository.url.full', remoteUrl);
        }
        if (branchName != null) {
          span.setAttribute('vcs.ref.head.name', branchName);
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
    const repo = this.getContext('repo');
    return repo.project;
  }

  getLatestVersion() {
    const { tagTemplate, latestTag } = this.config.getContext();
    const prefix = format(tagTemplate.replace(/\$\{version\}/, ''), this.config.getContext());
    return latestTag ? latestTag.replace(prefix, '').replace(/^v/, '') : null;
  }

  async getCommitsSinceLatestTag(commitsPath = '') {
    return tracer.startActiveSpan('release_it.git_base.get_commits_since_latest_tag', async span => {
      try {
        const latestTagName = await this.getLatestTagName();
        const ref = latestTagName ? `${latestTagName}..HEAD` : 'HEAD';
        const result = await this.exec(`git rev-list ${ref} --count ${commitsPath ? `-- ${commitsPath}` : ''}`, { options }).then(Number);
        span.setAttribute('release_it.git.commits_since_tag', result);
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

  async getChangelog() {
    return tracer.startActiveSpan('release_it.git_base.get_changelog', async span => {
      try {
        const { snapshot } = this.config.getContext();
        const { latestTag, secondLatestTag } = this.config.getContext();
        const context = { latestTag, from: latestTag, to: 'HEAD' };
        const { changelog, commit } = this.options;
        if (!changelog) return null;

        if (latestTag && !this.config.isIncrement) {
          if ((await this.getCommitsSinceLatestTag()) === 0) {
            context.from = secondLatestTag;
            context.to = `${latestTag}^1`;
          } else if (commit === false) {
            context.to = 'HEAD^1';
          }
        }

        // For now, snapshots do not get a changelog, as it often goes haywire (easy to add to release manually)
        if (snapshot) return '';

        if (!context.from && changelog.includes('${from}')) {
          const result = await this.exec(changelogFallback);
          if (result != null) {
            span.setAttribute('release_it.changelog.length', result.length);
          }
          return result;
        }

        const result = await this.exec(changelog, { context, options });
        if (result != null) {
          span.setAttribute('release_it.changelog.length', result.length);
        }
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

  bump(version) {
    const { tagTemplate } = this.config.getContext();
    const context = Object.assign(this.config.getContext(), { version });
    const tagName = format(tagTemplate, context) || version;
    this.setContext({ version });
    this.config.setContext({ tagName });
  }

  isRemoteName(remoteUrlOrName) {
    return remoteUrlOrName && !remoteUrlOrName.includes('/');
  }

  async getRemoteUrl() {
    return tracer.startActiveSpan('release_it.git_base.get_remote_url', async span => {
      try {
        const remoteNameOrUrl = this.options.pushRepo || (await this.getRemote()) || 'origin';
        span.setAttribute('release_it.git.remote_ref', remoteNameOrUrl);
        return this.isRemoteName(remoteNameOrUrl)
          ? this.exec(`git remote get-url ${remoteNameOrUrl}`, { options }).catch(() =>
              this.exec(`git config --get remote.${remoteNameOrUrl}.url`, { options }).catch(() => null)
            )
          : remoteNameOrUrl;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  async getRemote() {
    return tracer.startActiveSpan('release_it.git_base.get_remote', async span => {
      try {
        const branchName = await this.getBranchName();
        if (branchName != null) {
          span.setAttribute('vcs.ref.head.name', branchName);
        }
        return branchName ? await this.getRemoteForBranch(branchName) : null;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  getBranchName() {
    return this.exec('git rev-parse --abbrev-ref HEAD', { options }).catch(() => null);
  }

  getRemoteForBranch(branch) {
    return this.exec(`git config --get branch.${branch}.remote`, { options }).catch(() => null);
  }

  fetch(remoteUrl) {
    return this.exec('git fetch').catch(err => {
      this.debug(err);
      throw new Error(`Unable to fetch from ${remoteUrl}${EOL}${err.message}`);
    });
  }

  getLatestTagName() {
    const context = Object.assign({}, this.config.getContext(), { version: '*' });
    const match = format(this.options.tagMatch || this.options.tagName || '${version}', context);
    const exclude = this.options.tagExclude ? ` --exclude=${format(this.options.tagExclude, context)}` : '';
    if (this.options.getLatestTagFromAllRefs) {
      return this.exec(
        `git -c "versionsort.suffix=-" for-each-ref --count=1 --sort=-v:refname --format="%(refname:short)" refs/tags/${match}`,
        { options }
      ).then(
        stdout => stdout || null,
        () => null
      );
    } else {
      return this.exec(`git describe --tags --match=${match} --abbrev=0${exclude}`, { options }).then(
        stdout => stdout || null,
        () => null
      );
    }
  }

  async getSecondLatestTagName(latestTag) {
    return tracer.startActiveSpan('release_it.git_base.get_second_latest_tag_name', async span => {
      try {
        if (latestTag != null) {
          span.setAttribute('release_it.git.tag_name', latestTag);
        }
        const sha = await this.exec(`git rev-list ${latestTag || '--skip=1'} --tags --max-count=1`, {
          options
        });
        return this.exec(`git describe --tags --abbrev=0 "${sha}^"`, { options }).catch(() => null);
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }
}

export default GitBase;
