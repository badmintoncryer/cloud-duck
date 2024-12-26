import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import { App, RemovalPolicy, Size, Stack, StackProps } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { CloudDuck } from '../src';

const app = new App();

class TestStack extends Stack {
  constructor(scope: App, id: string, _props: StackProps = {}) {
    super(scope, id);

    const targetBucket = new s3.Bucket(this, 'TargetBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new CloudDuck(this, 'CloudDuck', {
      targetBuckets: [targetBucket],
      memory: Size.gibibytes(2),
    });
  }
}

const stack = new TestStack(app, 'TestStack');

new IntegTest(app, 'Test', {
  testCases: [stack],
});