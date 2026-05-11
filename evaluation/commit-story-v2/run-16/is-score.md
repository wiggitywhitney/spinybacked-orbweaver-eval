IS Score: 80 / 100

Rule Results:
✅ RES-005 (Critical): service.name present
❌ RES-001: service.instance.id absent from resource attributes
✅ RES-004: semconv attributes at correct OTLP level
❌ SPA-001: trace 0e68801f has 12 INTERNAL spans (limit 10)
✅ SPA-002: no orphan spans
✅ SPA-003: 21 unique span name(s), no interpolated values detected
✅ SPA-004: root spans are not CLIENT kind
✅ SPA-005: 17 span(s) with duration <5ms (within limit of 20)

Applicable rules: 8 | Passed: 6 | Failed: 2 | Not applicable (skipped): 7
Weighted score: 8/10 points (Critical rules weighted 3×)
