IS Score: 80 / 100

Rule Results:
✅ RES-005 (Critical): service.name present
✅ RES-001: service.instance.id present
✅ RES-004: semconv attributes at correct OTLP level
❌ SPA-001: trace 9f1f4288 has 29 INTERNAL spans (limit 10)
❌ SPA-002: span ce5f0429 has orphan parentSpanId 25a9f60d
✅ SPA-003: 28 unique span name(s), no interpolated values detected
✅ SPA-004: root spans are not CLIENT kind
✅ SPA-005: 20 span(s) with duration <5ms (within limit of 20)

Applicable rules: 8 | Passed: 6 | Failed: 2 | Not applicable (skipped): 7
Weighted score: 8/10 points (Critical rules weighted 3×)
