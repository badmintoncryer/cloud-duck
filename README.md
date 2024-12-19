<p align="center">
  <img src="src/frontend/public/icon.png" alt="CloudDuck Icon" style="max-width: 400px; max-height: 400px;" />
</p>

CloudDuck is a simple and easy-to-use analysis environment for S3 data, featuring DuckDB with built-in authentication.

<p align="center">
  <img src="images/duckdb-image.png" alt="CloudDuck Display Image" />
</p>

## Architecture

![Architecture](images/architecture.png)

## Installation

```bash
npm i cloud-duck
```

## Usage

### Deploy

```typescript
import { CloudDuck } from 'cloud-duck';

declare const logBucket: s3.IBucket;

new CloudDuck(this, 'CloudDuck', {
  // The S3 bucket to analyze
  // CloudDuck can access to all of the buckets in the account by default.
  // If you want to restrict the access, you can use the targetBuckets property.
  targetBuckets: [logBucket],
});
```

### Add user to the Cognito User Pool

