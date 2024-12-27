<p align="center">
  <img src="frontend/public/icon.png" alt="CloudDuck Icon" style="max-width: 300px; max-height: 300px;" />
</p>

CloudDuck is a CDK construct for simple and easy-to-use analysis environment for S3 data, featuring DuckDB with built-in authentication.

By simply deploying the Construct, you can launch a SaaS that provides an analytics dashboard like the one shown below.
User authentication for access is implemented using Cognito, ensuring that only authorized users can log in.

<p align="center">
  <img src="images/cloudduck.gif" alt="CloudDuck Display Image" />
</p>

[![View on Construct Hub](https://constructs.dev/badge?package=cloud-duck)](https://constructs.dev/packages/cloud-duck)
[![Open in Visual Studio Code](https://img.shields.io/static/v1?logo=visualstudiocode&label=&message=Open%20in%20Visual%20Studio%20Code&labelColor=2c2c32&color=007acc&logoColor=007acc)](https://open.vscode.dev/badmintoncryer/cloud-duck)
[![npm version](https://badge.fury.io/js/cloud-duck.svg)](https://badge.fury.io/js/cloud-duck)
[![Build Status](https://github.com/badmintoncryer/cloud-duck/actions/workflows/build.yml/badge.svg)](https://github.com/badmintoncryer/cloud-duck/actions/workflows/build.yml)
[![Release Status](https://github.com/badmintoncryer/cloud-duck/actions/workflows/release.yml/badge.svg)](https://github.com/badmintoncryer/cloud-duck/actions/workflows/release.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
![Downloads](https://img.shields.io/badge/-DOWNLOADS:-brightgreen?color=gray)
![npm downloads](https://img.shields.io/npm/dt/cloud-duck?label=npm&color=blueviolet)

## Use Cases

- When you want to request data analysis on S3 using DuckDB but prefer not to issue S3 access credentials to the analysts.
- When you want to minimize the costs incurred from downloading large amounts of S3 data to local storage.

## Architecture

![Architecture](images/architecture.png)

## Installation

```bash
npm i cloud-duck
```

## Setup

### Deploy

You can deploy the CloudDuck with the following code in the CDK stack.

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

Add a user to the Cognito User Pool with the following command.

```sh
aws cognito-idp admin-create-user \
--user-pool-id "us-east-1_XXXXX" \
--username "naonao@example.com" \
--user-attributes Name=email,Value="naonao@example.com" Name=email_verified,Value=true \
--message-action SUPPRESS \
--temporary-password Password1!
```

You can also add a user via the AWS Management Console.

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

Detail usage of DuckDB is available at [DuckDB Documentation](https://duckdb.org/docs/sql/introduction.html).

### Persistence

All query results are persisted in individual DuckDB files for each user.
Therefore, you can freely save your query results without worrying about affecting other users.

### Note

CloudDuck is still under development. Updates may include breaking changes. If you encounter any bugs, please report them via issues.
