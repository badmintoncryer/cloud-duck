import { awscdk } from 'projen';
import { NodePackageManager } from 'projen/lib/javascript';
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Kazuho CryerShinozuka',
  authorAddress: 'malaysia.cryer@gmail.com',
  cdkVersion: '2.160.0',
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.6.0',
  name: 'cloud-duck',
  projenrcTs: true,
  repositoryUrl: 'https://github.com/badmintoncryer/cloud-duck.git',
  keywords: ['aws', 'cdk', 's3', 'duckdb', 'cognito', 'lambda', 'api-gateway', 'frontend'],
  gitignore: ['*.js', '*.d.ts', '!test/*.snapshot/**/*', '.tmp', '!remix.config.js', '!postcss.config.js'],
  deps: ['deploy-time-build'],
  description: 'CDK construct for creating an analysis environment using DuckDB for S3 data',
  devDeps: [
    '@aws-cdk/integ-runner@2.160.0-alpha.0',
    '@aws-cdk/integ-tests-alpha@2.160.0-alpha.0',
    '@aws-sdk/client-s3',
    '@types/aws-lambda',
    'esbuild',
  ],
  excludeTypescript: ['frontend/**/*.ts', 'test/.*.snapshot/**/*'],
  packageManager: NodePackageManager.PNPM,
  tsconfig: {
    exclude: ['frontend/**/*', 'test/*.snapshot/**/*', 'node_modules'],
  },
  tsconfigDev: {
    exclude: ['frontend/**/*', 'test/*.snapshot/**/*', 'node_modules'],
  },
  eslint: true,
  eslintOptions: {
    dirs: ['src'],
    ignorePatterns: ['*.js', '*.d.ts', 'node_modules/', '*.generated.ts', 'coverage', 'test/*.snapshot/**/*'],
  },
  releaseToNpm: true,
  packageName: 'cloud-duck',
  publishToPypi: {
    distName: 'cloud-duck',
    module: 'cloud-duck',
  },
});
project.projectBuild.compileTask.prependExec('npm ci && npm run build', {
  cwd: 'lambda/duckdb',
});
project.projectBuild.testTask.exec(
  'pnpm tsc -p tsconfig.dev.json && pnpm integ-runner',
);
project.synth();
