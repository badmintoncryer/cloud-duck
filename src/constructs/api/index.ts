import { Construct } from "constructs";
import { RemovalPolicy, Size } from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from "node:path";
import { Duration } from "aws-cdk-lib";

export interface ApiProps {
  readonly userPool: cognito.IUserPool;
  readonly memory?: Size;
  readonly targetBuckets?: s3.IBucket[];
}

export class Api extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    this.api = new apigateway.RestApi(this, "Api", {
      description: "CloudDuckApi",
      deployOptions: {
        stageName: "api",
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "Authorizer",
      {
        cognitoUserPools: [props.userPool],
      }
    );

    const resource = this.api.root.addResource("v1");
    resource.addMethod("GET", new apigateway.MockIntegration({
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({ message: "Hello, CloudDuck!" }),
        }),
      },
      integrationResponses: [
        {
          statusCode: "200",
          responseTemplates: {
            "application/json": JSON.stringify({
              message: "Hello, CloudDuck!",
            }),
          },
        },
      ],
    }), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const duckdbBucket = new s3.Bucket(this, "DuckDbBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const duckdbHandler = new lambda.Function(this, "DuckDbHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../lambda/duckdb/build")),
      handler: "index.handler",
      timeout: Duration.minutes(15),
      memorySize: props.memory?.toMebibytes() ?? 1024,
      environment: {
        S3_BUCKET: duckdbBucket.bucketName,
      },
    });
    duckdbHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject", "s3:ListBucket"],
        resources: props.targetBuckets ? props.targetBuckets.map((bucket) => bucket.arnForObjects('*')) : ["*"],
      })
    );
    duckdbBucket.grantReadWrite(duckdbHandler);
    duckdbHandler.addLayers(lambda.LayerVersion.fromLayerVersionArn(
      this, 'DuckdbLayer', 'arn:aws:lambda:us-east-1:041475135427:layer:duckdb-nodejs-x86:14',
    ));
    const duckdb = resource.addResource("duckdb");
    duckdb.addMethod(
      "POST",
      new apigateway.LambdaIntegration(
        duckdbHandler,
      ),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );
  }
}
