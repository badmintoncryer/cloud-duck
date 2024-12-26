<p align="center">
  <img src="src/frontend/public/icon.png" alt="CloudDuck Icon" style="max-width: 400px; max-height: 400px;" />
</p>

CloudDuck is a simple and easy-to-use analysis environment for S3 data, featuring DuckDB with built-in authentication.

<p align="center">
  <img src="images/cloudduck.gif" alt="CloudDuck Display Image" />
</p>

## Architecture

![Architecture](images/architecture.png)

## Installation

```bash
npm i cloud-duck
```

## Setup

### Deploy

```typescript
import { Size } from 'aws-cdk-lib';
import { CloudDuck } from 'cloud-duck';

declare const logBucket: s3.IBucket;

new CloudDuck(this, 'CloudDuck', {
  // The S3 bucket to analyze
  // CloudDuck can access to all of the buckets in the account by default.
  // If you want to restrict the access, you can use the targetBuckets property.
  targetBuckets: [logBucket],
  // The memory size of the Lambda function
  // Default: 1024 MB
  memory: Size.mebibytes(1024),
});
```

### Add user to the Cognito User Pool

Add user to the Cognito User Pool to access the CloudDuck.

```sh
aws cognito-idp admin-create-user \
--user-pool-id "us-east-1_XXXXX" \
--username "naonao@example.com" \
--user-attributes Name=email,Value="naonao@example.com" Name=email_verified,Value=true \
--message-action SUPPRESS \
--temporary-password Password1!
```

### Access

Access to the CloudDuck with the cloudfront URL.

```bash
❯ npx cdk deploy
...
AwsStack.CloudDuckDistributionUrl84FC8296 = https://dosjykpv096qr.cloudfront.net
Stack ARN:
arn:aws:cloudformation:us-east-1:123456789012:stack/AwsStack/dd0960c0-b3d5-11ef-bcfc-12cf7722116f

✨  Total time: 73.59s
```

Enter the username and password.

![Login](images/login.png)

When you log in at the first time, you need to change the password.

![Change Password](images/change-password.png)

Play with the CloudDuck!

![CloudDuck](images/home.png)

## Usage

### Query

You can query the S3 data with SQL.

```sql
SELECT * FROM read_csv_auto('s3://your-bucket-name/your-file.csv');
SELECT * FROM parquet_scan('s3://your-bucket-name/your-file.parquet');
```

Ofcourse, you can store the result as a new table.

```sql
CREATE TABLE new_table AS SELECT * FROM read_csv_auto('s3://your-bucket-name/your-file.csv');
```

### Persistence

All query results are persisted in individual DuckDB files for each user.
Therefore, you can freely save your query results without worrying about affecting other users.

### Note

CloudDuck is still under development. Updates may include breaking changes. If you encounter any bugs, please report them via issues.
