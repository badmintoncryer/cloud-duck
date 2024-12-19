import { awscdk } from 'projen';
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Kazuho CryerShinozuka',
  authorAddress: 'malaysia.cryer@gmail.com',
  cdkVersion: '2.160.0',
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.6.0',
  name: 'cloud-duck',
  projenrcTs: true,
  repositoryUrl: 'https://github.com/malaysia.cryer/cloud-duck.git',
  keywords: ['aws', 'cdk', 's3', 'duckdb', 'cognito'],
  gitignore: ['*.js', '*.d.ts', '!test/.*.snapshot/**/*', '.tmp', '!remix.config.js', '!postcss.config.js'],
  deps: ['deploy-time-build'],
  description: 'CDK construct for creating an analysis environment using DuckDB for S3 data',
  devDeps: [
    '@aws-cdk/integ-runner@2.160.0-alpha.0',
    '@aws-cdk/integ-tests-alpha@2.160.0-alpha.0',
    'aws-lambda',
    'duckdb',
    '@aws-sdk/client-s3',
  ],
  releaseToNpm: true,
  packageName: 'cloud-duck',
  publishToPypi: {
    distName: 'cloud-duck',
    module: 'cloud-duck',
  },
});
project.projectBuild.testTask.exec(
  'yarn tsc -p tsconfig.dev.json && yarn integ-runner',
);
project.synth();
