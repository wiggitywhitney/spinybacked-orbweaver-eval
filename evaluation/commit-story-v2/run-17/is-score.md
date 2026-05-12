IS Score: 90 / 100

Rule Results:
✅ RES-005 (Critical): service.name present
✅ RES-001: service.instance.id present
✅ RES-004: semconv attributes at correct OTLP level
❌ SPA-001: trace 365b5d5d has 12 INTERNAL spans (limit 10)
✅ SPA-002: no orphan spans
✅ SPA-003: 18 unique span name(s), no interpolated values detected
✅ SPA-004: root spans are not CLIENT kind
✅ SPA-005: 14 span(s) with duration <5ms (within limit of 20)

Applicable rules: 8 | Passed: 7 | Failed: 1 | Not applicable (skipped): 7
Weighted score: 9/10 points (Critical rules weighted 3×)
