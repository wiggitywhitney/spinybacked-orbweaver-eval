# Schema Omissions — release-it Run-1

`semconv/attributes.yaml` in the forked release-it repo is deliberately incomplete.
`schema-complete.yaml` in this directory is the full reference schema.

The four attributes below were removed to test spiny-orb's SCH extension capability:
whether it can identify missing attributes and propose schema extensions based on reading
the instrumented source code.

---

## Omitted Attribute 1: `release_it.git.tag_annotation`

**Type**: string  
**Where it appears in code**: `lib/plugin/git/Git.js`, `tag()` method (line ~189)

```js
tag({ name, annotation = this.options.tagAnnotation, args = this.options.tagArgs } = {}) {
  const message = format(annotation, this.config.getContext());
  return this.exec(['git', 'tag', '--annotate', '--message', message, ...fixArgs(args), tagName])
```

**Why spiny-orb should infer it**: The `annotation` parameter is formatted and passed as
the `--message` argument to `git tag --annotate`. This is the annotation text attached to
the tag — a core parameter of the tagging operation with a clear name in the function
signature. Any instrumentation agent reading this function would see it as a span attribute
candidate.

**Why it's a good omission**: It describes a function parameter that directly affects what
git writes to the repository. It is not a generic OTel attribute — it requires understanding
what release-it's tag operation does.

---

## Omitted Attribute 2: `release_it.github.release_name`

**Type**: string  
**Where it appears in code**: `lib/plugin/github/GitHub.js`, `getOctokitReleaseOptions()` (line ~223)

```js
const { releaseName, draft = false, ... } = this.options;
const name = format(releaseName, this.config.getContext());
// ...
const contextOptions = {
  // ...
  name,   // <-- passed as the GitHub release title
```

**Why spiny-orb should infer it**: `releaseName` is a named config option formatted and
assigned to the `name` field of the Octokit `createRelease` call. It's the human-readable
title of the GitHub release. An instrumentation agent reading `getOctokitReleaseOptions()`
would see `name` as a clear output attribute.

**Why it's a good omission**: It's the release title — central to what a GitHub release is.
Requires understanding that `name` here is the release title, not a generic identifier.

---

## Omitted Attribute 3: `release_it.github.release_url`

**Type**: string  
**Where it appears in code**: `lib/plugin/github/GitHub.js`, `createRelease()` (line ~273)

```js
const { html_url, upload_url, id, discussion_url } = response.data;
this.setContext({
  isReleased: true,
  releaseId: id,
  releaseUrl: html_url,   // <-- stored as key output
  upload_url,
  discussionUrl: discussion_url
});
```

**Why spiny-orb should infer it**: `html_url` from the Octokit createRelease response is
explicitly stored as `releaseUrl` in context. It is the primary output of a successful
GitHub release — the URL users navigate to. An instrumentation agent reading this function
would identify it as a high-value span attribute.

**Why it's a good omission**: This is an operation *output* (response field), not a config
parameter. It tests whether spiny-orb can identify attributes derived from API responses,
not just inputs passed in.

---

## Omitted Attribute 4: `release_it.npm.publish_path`

**Type**: string  
**Where it appears in code**: `lib/plugin/npm/npm.js`, `publish()` (line ~255)

```js
async publish({ otp = this.options.otp, otpCallback } = {}) {
  const publishPackageManager = this.options.publishPackageManager || 'npm';
  const { publishPath = '.', publishArgs } = this.options;
  // ...
  const args = [
    publishPath,   // <-- first argument to `npm publish`
    '--tag',
    tag,
```

**Why spiny-orb should infer it**: `publishPath` is destructured from options with a
default of `'.'` and passed as the first positional argument to `npm publish`. It controls
which directory is published — a concrete parameter that affects what gets published. An
instrumentation agent reading this function would find `publishPath` as a named option with
a clear role.

**Why it's a good omission**: It requires knowing that the first argument to `npm publish`
is a path, and that publishing from a subdirectory (`dist/`, `lib/`) vs root (`.`) is a
meaningful distinction worth capturing.
