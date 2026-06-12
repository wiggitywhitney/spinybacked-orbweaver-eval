IS Score: 80 / 100

Rule Results:
✅ RES-005 (Critical): service.name present
✅ RES-001: service.instance.id present
✅ RES-004: semconv attributes at correct OTLP level
❌ SPA-001: trace e41bf7db has 25 INTERNAL spans (limit 10)
❌ SPA-002: span b5a83f5e has orphan parentSpanId 3a70d1c5
✅ SPA-003: 22 unique span name(s), no interpolated values detected
✅ SPA-004: root spans are not CLIENT kind
✅ SPA-005: 12 span(s) with duration <5ms (within limit of 20)

Applicable rules: 8 | Passed: 6 | Failed: 2 | Not applicable (skipped): 7
Weighted score: 8/10 points (Critical rules weighted 3×)

service.instance.id: 2140b04c-6055-4731-8b53-2d4225017478
trace_id: e41bf7dbf6a3a6424d36cabf57eee3d8
captured: 2026-06-11T01:34:14Z
