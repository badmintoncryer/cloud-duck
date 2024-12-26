import {
  CognitoIdentityClient,
  GetIdCommand,
} from "@aws-sdk/client-cognito-identity";
import {
  CognitoIdentityCredentialProvider,
  fromCognitoIdentity,
  fromCognitoIdentityPool,
} from "@aws-sdk/credential-provider-cognito-identity";
import { fetchAuthSession } from "@aws-amplify/auth";
import { Amplify } from "aws-amplify";
import { useEffect, useState } from "react";
import { GetObjectCommand, paginateListBuckets, S3Client } from "@aws-sdk/client-s3";

const region = import.meta.env.VITE_COGNITO_REGION ?? "us-east-1";

export const useClient = () => {
  const [idToken, setIdToken] = useState<string | null>(null);
  const [identityId, setIdentityId] = useState<string | null>(null);
  const [credentials, setCredentials] =
    useState<CognitoIdentityCredentialProvider | null>(null);
  const [s3Client, setS3Client] = useState<S3Client | null>(null);

  const authConfig = Amplify.getConfig().Auth?.Cognito;
  const identityPoolId = authConfig?.identityPoolId ?? null;
  const userPoolId = authConfig?.userPoolId
    ? `cognito-idp.${region}.amazonaws.com/${authConfig.userPoolId}`
    : null;

  useEffect(() => {
    fetchAuthSession().then((session) => {
      setIdToken(session.tokens?.idToken?.toString() ?? null);
    });

    return () => {
      setIdToken(null);
    };
  }, []);

  useEffect(() => {
    console.log("getting identity id");
    if (!identityPoolId || !userPoolId || !idToken) {
      console.log("early return from getting identity id");
      return;
    }

    const cognito = new CognitoIdentityClient({ region });
    cognito
      .send(
        new GetIdCommand({
          IdentityPoolId: identityPoolId,
          Logins: {
            [userPoolId]: idToken,
          },
        })
      )
      .then((identity) => {
        console.log("got identity id");
        setIdentityId(identity?.IdentityId ?? null);
        console.log(JSON.stringify(identity, null, 2));
      });

    return () => {
      setIdentityId(null);
    };
  }, [idToken, identityPoolId, userPoolId]);

  useEffect(() => {
    console.log("getting credentials");
    if (!identityId || !idToken || !userPoolId) {
      console.log("early return from getting credentials");
      return;
    }

    const s3Client = new S3Client({
      region,
      credentials: fromCognitoIdentity({
        client: new CognitoIdentityClient({ region }),
        identityId: identityId,
        logins: {
          [userPoolId]: idToken,
        },
      }),
    });

    console.log("got credentials");
    setS3Client(s3Client);

    const paginator = paginateListBuckets({ client: s3Client }, {});

    paginator.next().then((page) => {
      console.log(JSON.stringify(page, null, 2));
    });

    return () => {
      setCredentials(null);
    };
  }, [identityId, idToken, userPoolId]);

  useEffect(() => {
    if (!identityPoolId || !userPoolId || !idToken) {
      return;
    }

    const s3 = new S3Client({
      region,
      credentials: fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region }),
        identityPoolId,
        logins: {
          [userPoolId]: idToken,
        },
      }),
    });

    s3.send(
      new GetObjectCommand({ Bucket: 'hogehoge', Key: 'fugafuga' }),
    );
  });

  return { credentials, region, s3Client };
};
