// ABOUTME: OpenTelemetry SDK initialization for commit-story-v2.
// ABOUTME: Bootstraps the NodeSDK with an instrumentations array for the telemetry agent to populate.

import { NodeSDK } from '@opentelemetry/sdk-node';

const instrumentations = [
  // Telemetry agent appends instrumentation entries here
];

const sdk = new NodeSDK({
  instrumentations,
});

sdk.start();

export default sdk;
