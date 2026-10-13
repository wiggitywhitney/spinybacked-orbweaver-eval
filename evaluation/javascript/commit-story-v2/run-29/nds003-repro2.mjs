// ABOUTME: Runs the normalized NDS-003 path, the one the rule may call, on the same guard shapes.
// ABOUTME: Confirms whether the optional-chained null guard fails after AST stripping too.
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const checkout = process.env.SPINY_ORB_CHECKOUT;
if (!checkout) {
  console.error('Set SPINY_ORB_CHECKOUT to the spiny-orb checkout whose dist/ to test (run-29 used the build at 475eb3d).');
  process.exit(1);
}
const { checkNonInstrumentationDiffNormalized } = await import(pathToFileURL(join(checkout, 'dist/languages/javascript/rules/nds003.js')).href);
const original = `async function f(result) {\n  const x = result.content;\n  return x;\n}\n`;
const mk = (cond) => `async function f(result) {\n  if (${cond}) {\n    span.setAttribute('k', 1);\n  }\n  const x = result.content;\n  return x;\n}\n`;
for (const cond of ['result.usage_metadata != null', 'result.response_metadata?.model != null']) {
  const r = await checkNonInstrumentationDiffNormalized(original, mk(cond), 'f.js');
  console.log(JSON.stringify(cond), '->', JSON.stringify(r).slice(0, 200));
}
