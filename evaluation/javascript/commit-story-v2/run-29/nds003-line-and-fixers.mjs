// ABOUTME: Replays NDS-003's normalized path on the summary-graph.js debug dump to locate "line 187".
// ABOUTME: Also reruns spiny-orb's deterministic fixers on the dump to show they leave the guard lines alone.
import { pathToFileURL, fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const checkout = process.env.SPINY_ORB_CHECKOUT;
const target = process.env.COMMIT_STORY_CHECKOUT;
if (!checkout || !target) {
  console.error('Set SPINY_ORB_CHECKOUT (run-29 used the build at 475eb3d) and COMMIT_STORY_CHECKOUT (the commit-story-v2 clone).');
  process.exit(1);
}
const load = (p) => import(pathToFileURL(join(checkout, 'dist', p)).href);
const { checkNonInstrumentationDiff, prettierNormalizeForComparison } = await load('languages/javascript/rules/nds003.js');
const { stripOtelNodes } = await load('languages/javascript/rules/nds003-ast-stripper.js');
const { normalizeMultiLineFlags } = await load('languages/javascript/rules/nds003-multiline-normalizer.js');
const { JavaScriptProvider } = await load('languages/javascript/index.js');

const here = dirname(fileURLToPath(import.meta.url));
const dump = readFileSync(join(here, 'debug-dumps/src/generators/summary-graph.js'), 'utf-8');
// commit-story-v2 main at the run's start (D-8): the file spiny-orb compared against.
const original = execFileSync('git', ['-C', target, 'show', 'fa26743:src/generators/summary-graph.js'], { encoding: 'utf-8' });
const filePath = join(target, 'src/generators/summary-graph.js');

// Same steps as checkNonInstrumentationDiffNormalized (nds003.ts), the path nds003Rule.check calls.
const singleQuote = (original.match(/'/g) ?? []).length > (original.match(/"/g) ?? []).length;
const normOriginal = await prettierNormalizeForComparison(normalizeMultiLineFlags(original), filePath, singleQuote);
const normStripped = await prettierNormalizeForComparison(normalizeMultiLineFlags(stripOtelNodes(dump, filePath)), filePath, singleQuote);
const failures = checkNonInstrumentationDiff(normOriginal, normStripped, filePath).filter((r) => !r.passed);
console.log(`NDS-003 failures on the dump: ${failures.length}`);
for (const f of failures) console.log(`  ${f.message.split('\n')[0]}`);
const strippedLines = normStripped.split('\n');
for (const f of failures) console.log(`  normalized stripped line ${f.lineNumber}: ${strippedLines[f.lineNumber - 1].trim()}`);

// Rerun the retry loop's fixers that need no run-specific input. The other three
// (fixCanonicalTracerName, fixAttributeTypeCoercions, fixDelimiterVariants) rewrite only
// getTracer() names, setAttribute values, and attribute key strings, never if conditions.
const p = new JavaScriptProvider();
let fixed = dump;
fixed = p.ensureTracerAfterImports(fixed);
fixed = p.fixProcessExitSpanEnd(fixed);
fixed = p.fixIsRecordingGuards(fixed);
fixed = p.fixUntypedStringMethods(fixed);
fixed = p.fixNotNullSafeGuards(fixed);
const guard = (code) => code.split('\n').filter((l) => l.includes('if (result.response_metadata')).map((l) => l.trim());
console.log(`guard lines before fixers: ${JSON.stringify(guard(dump))}`);
console.log(`guard lines after fixers:  ${JSON.stringify(guard(fixed))}`);
console.log(`fixers changed the dump: ${fixed !== dump}`);
// An agent-style !== undefined form goes through fixNotNullSafeGuards unchanged too, because
// the setAttribute value is a String(...) call, not a bare property access.
const variant = dump.replaceAll('result.response_metadata?.model != null', 'result.response_metadata?.model !== undefined');
console.log(`!== undefined variant after fixNotNullSafeGuards: ${JSON.stringify(guard(p.fixNotNullSafeGuards(variant)))}`);
