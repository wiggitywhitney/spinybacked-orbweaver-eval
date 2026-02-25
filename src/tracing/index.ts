// Stub for evaluation — provides getTracer used by kubectl.ts
import { trace } from "@opentelemetry/api";

export function getTracer() {
  return trace.getTracer("commit-story-v2-eval");
}
