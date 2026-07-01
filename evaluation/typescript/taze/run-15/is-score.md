IS Score: 80 / 100

Rule Results:
✅ RES-005 (Critical): service.name present
✅ RES-001: service.instance.id present
✅ RES-004: semconv attributes at correct OTLP level
❌ SPA-001: trace 86f7d367 has 45 INTERNAL spans (limit 30)
❌ SPA-002: span f96f214c has orphan parentSpanId 7371f0db
✅ SPA-003: 8 unique span name(s), no interpolated values detected
✅ SPA-004: root spans are not CLIENT kind
✅ SPA-005: 6 span(s) with duration <5ms (within limit of 20)

Applicable rules: 8 | Passed: 6 | Failed: 2 | Not applicable (skipped): 7
Weighted score: 8/10 points (Critical rules weighted 3×)
