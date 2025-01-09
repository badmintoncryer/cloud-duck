import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface CognitoProps {
  userpool?: cognito.IUserPool;
  callbackUrls?: string[];
  logoutUrls?: string[];
  userPoolProps?: cognito.UserPoolProps;
}

export class Cognito extends Construct {
  public readonly userPool: cognito.IUserPool;
  public readonly appClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: CognitoProps) {
    super(scope, id);

    this.userPool = props?.userpool ?? new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
      ...props?.userPoolProps,
    });

    this.appClient = this.userPool.addClient('Client', {
      generateSecret: false,
      authFlows: {
        userSrp: true,
        userPassword: true,
        adminUserPassword: true,
      },
      oAuth: {
        callbackUrls: props?.callbackUrls,
        logoutUrls: props?.logoutUrls,
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
      },
      preventUserExistenceErrors: true,
    });

    new CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
    });
  }
}
