import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { RemovalPolicy } from "aws-cdk-lib";

export interface CognitoProps {
  userpool?: cognito.IUserPool;
  callbackUrls?: string[];
  logoutUrls?: string[];
}

export class Cognito extends Construct {
  public readonly userPool: cognito.IUserPool;
  public readonly userPoolDomain: cognito.UserPoolDomain;
  public readonly appClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: CognitoProps) {
    super(scope, id);

    this.userPool = props?.userpool ?? new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });
    this.userPoolDomain = this.userPool.addDomain("Domain", {
      cognitoDomain: {
        domainPrefix: "cloudduck",
      },
    });

    this.appClient = this.userPool.addClient("Client", {
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
  }
}
