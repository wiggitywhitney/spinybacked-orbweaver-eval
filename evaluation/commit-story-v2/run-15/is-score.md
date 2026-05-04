IS Score: 70 / 100

Rule Results:
✅ RES-005 (Critical): service.name present
❌ RES-001: service.instance.id absent from resource attributes
✅ RES-004: semconv attributes at correct OTLP level
❌ SPA-001: trace 751318f7 has 37 INTERNAL spans (limit 10)
❌ SPA-002: span 47f9607c has orphan parentSpanId 749f9c3b
✅ SPA-003: 34 unique span name(s), no interpolated values detected
✅ SPA-004: root spans are not CLIENT kind
✅ SPA-005: 18 span(s) with duration <5ms (within limit of 20)

Applicable rules: 8 | Passed: 5 | Failed: 3 | Not applicable (skipped): 7
Weighted score: 7/10 points (Critical rules weighted 3×)
