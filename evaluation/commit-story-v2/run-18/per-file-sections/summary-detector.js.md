### src/utils/summary-detector.js (9 spans, 1 attempt, $0.29)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-003 | PASS | Original business logic preserved verbatim; wrapping adds only span scaffolding |
| NDS-004 | PASS | `import { trace, SpanStatusCode } from '@opentelemetry/api'` added; no other new imports |
| NDS-005 | PASS | Inner readdir try/catch blocks (graceful-degradation, return `[]`/`new Set()`) preserved unmodified; outer span-level catch handles unexpected errors separately |
| NDS-006 | PASS | `const tracer = trace.getTracer('commit-story')` at module level, consistent with codebase |
| API-001 | PASS | All spans created via `tracer.startActiveSpan()`; `SpanStatusCode` from `@opentelemetry/api` |
| COV-001 | PASS | All 5 exported async functions have spans (`getDaysWithEntries`, `findUnsummarizedDays`, `getDaysWithDailySummaries`, `findUnsummarizedWeeks`, `findUnsummarizedMonths`) |
| COV-003 | PASS | Every span has `try/catch/finally` with `recordException`, `setStatus(ERROR)`, and `span.end()` in `finally` |
| COV-004 | PASS | All 9 async functions instrumented — includes 4 unexported helpers (`getSummarizedDays`, `getSummarizedWeeks`, `getSummarizedMonths`, `getWeeksWithWeeklySummaries`) each performing standalone filesystem I/O |
| COV-005 | PASS | Result count attribute set on every span: `day_count`, `week_count`, or `month_count` after computation |
| RST-001 | PASS | `getTodayString` and `getNowDate` are synchronous pure utilities — correctly skipped |
| RST-004 | PASS | Unexported helpers instrumented because each is a meaningful standalone I/O operation; RST-004 permits but does not require spans on unexported functions |
| SCH-001 | PASS | All 9 span names use `commit_story.summary.*` prefix; reported as schema extensions (not pre-declared) |
| SCH-002 | PASS | Attribute keys `commit_story.summary.day_count`, `week_count`, `month_count` not in `semconv/attributes.yaml`; reported as schema extensions; no collision with registered names |
| SCH-003 | PASS | All count attributes set from `dates.length`, `dates.size`, or array/Set sizes — always integer type |
| CDQ-001 | PASS | No redundant `span.end()` calls; `finally` block is the sole end point per span |
| CDQ-002 | PASS | No `console.log` or debug output added |
| CDQ-003 | PASS | No dead code, commented-out blocks, or placeholder stubs introduced |
| CDQ-005 | PASS | `span.recordException(error)` called before `setStatus(ERROR)` in every catch block |
| CDQ-006 | PASS | All span names are literal strings; no concatenation or template literals |
| CDQ-007 | PASS | All attributes derive from `.length` or `.size` on locally constructed arrays/Sets — always defined non-negative integers; no nullable external field access |

**Failures**: None

**Notes**:
- Complete instrumentation of all 9 async functions; resolves run-12 partial (2 exported functions missed due to API overload).
- Agent correctly invented new span names rather than reusing schema-declared names already claimed by earlier files in the run; 9 schema extensions reported.
- `getTodayString`/`getNowDate` skip is correct — both are synchronous with no I/O.
- Unexported helper instrumentation is sound: each performs an independent `readdir` I/O operation and adds diagnostic value per RST-004 permissive reading.
