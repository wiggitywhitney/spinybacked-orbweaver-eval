import { NodeSDK } from '@opentelemetry/sdk-node';

const sdk = new NodeSDK({
    instrumentations: [],
});

sdk.start();
