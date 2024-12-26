import { Construct } from "constructs";
import { CfnOutput, Lazy, RemovalPolicy, Size, Stack } from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import { NodejsBuild } from "deploy-time-build";
import * as path from "node:path";
import { Cognito } from "./constructs/cognito";
import { Api } from "./constructs/api";

/**
 * Props for the CloudDuck construct
 */
export interface CloudDuckProps {
  /**
   * The S3 buckets which the cloud duck will analyze
   *
   * @default - All buckets in the account
   */
  readonly targetBuckets?: s3.Bucket[];
  /**
   * The amount of memory to allocate to the Lambda function
   *
   * @default - 1024 MiB
   */
  readonly memory?: Size;
}

/**
 * The CloudDuck construct
 *
 * This construct creates a serverless analysis environment using DuckDB for S3 data
 */
export class CloudDuck extends Construct {
  constructor(scope: Construct, id: string, props?: CloudDuckProps) {
    super(scope, id);

    let distributionDomainName = '';

    const cognito = new Cognito(this, "Cognito", {
      callbackUrls: [Lazy.string({ produce: () => `https://${distributionDomainName}` })],
      logoutUrls: [Lazy.string({ produce: () => `https://${distributionDomainName}` })],
    });

    const api = new Api(this, "Api", {
      userPool: cognito.userPool,
      targetBuckets: props?.targetBuckets,
      memory: props?.memory,
    });

    const hostingBucket = new s3.Bucket(this, "HostingBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    const distribution = new cloudfront.Distribution(this, "CloudFront", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(hostingBucket),
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
      },
      // additionalBehaviors: {
      //   "/api/*": {
      //     origin: new origins.RestApiOrigin(api.api, {
      //       originPath: "/api",
      //     }),
      //     responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(scope, 'ResponsePolicy', {
      //       corsBehavior: {
      //         accessControlAllowCredentials: true,
      //         accessControlAllowHeaders: ['Authorization', 'Content-Type'],
      //         accessControlAllowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      //         accessControlAllowOrigins: [
      //           // `https://${this.domainName}`,
      //           "*"
      //         ],
      //         originOverride: true
      //       }
      //     }),
      //     cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      //     viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
      //     allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      //     originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      //   },
      // },
    });
    distributionDomainName = distribution.distributionDomainName;

    new NodejsBuild(this, "Build", {
      assets: [
        {
          path: path.join(__dirname, "../frontend"),
          exclude: ["node_modules", "build"],
        }
      ],
      destinationBucket: hostingBucket,
      distribution,
      outputSourceDirectory: "build/client",
      buildCommands: ["npm ci", "npm run build"],
      buildEnvironment: {
        VITE_COGNITO_USER_POOL_ID: cognito.userPool.userPoolId,
        VITE_COGNITO_USER_POOL_CLIENT_ID: cognito.appClient.userPoolClientId,
        VITE_COGNITO_REGION: cognito.userPool.stack.region,
        VITE_API_ROOT: `${api.api.url}v1`,
        VITE_AWS_ACCOUNT_ID: Stack.of(this).account,
        // VITE_API_ROOT: `https://${distributionDomainName}/api/v1`,
      }
    })

    new CfnOutput(this, "DistributionUrl", {
      value: `https://${distributionDomainName}`,
    });
  }
}
