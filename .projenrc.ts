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
    '@types/aws-lambda',
    'react',
    '@aws-sdk/client-cognito-identity',
    '@aws-sdk/credential-provider-cognito-identity',
    '@aws-amplify/auth',
    'aws-amplify',
    'tailwind-merge',
    'tailwindcss',
    '@remix-run/dev',
    'vite',
    'vite-tsconfig-paths',
    '@remix-run/node',
    'esbuild',
  ],
  excludeTypescript: ['src/frontend/**/*.ts', 'test/.*.snapshot/**/*'],
  packageManager: NodePackageManager.PNPM,
  tsconfig: {
    exclude: ['src/frontend/**/*', 'test/.*.snapshot/**/*'],
  },
  tsconfigDev: {
    exclude: ['src/frontend/**/*', 'test/.*.snapshot/**/*'],
  },
  eslint: false,
  eslintOptions: {
    dirs: ['src'],
    ignorePatterns: ['*.js', '*.d.ts', 'node_modules/', '*.generated.ts', 'coverage', 'src/frontend/**/*.ts', 'test/.*.snapshot/**/*'],
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
// project.projectBuild.testTask.exec(
//   'pnpm tsc -p tsconfig.dev.json && pnpm integ-runner',
// );
project.synth();
