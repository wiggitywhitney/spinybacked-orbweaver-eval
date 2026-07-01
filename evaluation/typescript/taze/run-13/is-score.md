IS Score: 60 / 100

Rule Results:
✅ RES-005 (Critical): service.name present
❌ RES-001: service.instance.id absent from resource attributes
✅ RES-004: semconv attributes at correct OTLP level
❌ SPA-001: trace 009cfb90 has 164 INTERNAL spans (limit 10)
❌ SPA-002: span 8d3427aa has orphan parentSpanId 00117ef5
✅ SPA-003: 11 unique span name(s), no interpolated values detected
✅ SPA-004: root spans are not CLIENT kind
❌ SPA-005: 42 spans have duration <5ms (limit 20)

Applicable rules: 8 | Passed: 4 | Failed: 4 | Not applicable (skipped): 7
Weighted score: 6/10 points (Critical rules weighted 3×)
