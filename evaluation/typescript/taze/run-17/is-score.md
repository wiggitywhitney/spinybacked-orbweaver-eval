IS Score: 77.8 / 100

Rule Results:
✅ RES-005 (Critical): service.name present
✅ RES-001: service.instance.id present
✅ RES-004: semconv attributes at correct OTLP level
❌ SPA-002: span 1b89a19e has orphan parentSpanId 5997dc1b
✅ SPA-003: 13 unique span name(s), no interpolated values detected
✅ SPA-004: root spans are not CLIENT kind
❌ SPA-005: 24 spans have duration <5ms (limit 20)

Applicable rules: 7 | Passed: 5 | Failed: 2 | Not applicable (skipped): 8
Weighted score: 7/9 points (Critical rules weighted 3×)
