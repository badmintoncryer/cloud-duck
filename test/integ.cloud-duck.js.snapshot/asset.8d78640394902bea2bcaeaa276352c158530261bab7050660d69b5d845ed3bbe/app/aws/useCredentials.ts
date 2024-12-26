import { fetchAuthSession } from "aws-amplify/auth";
import { useState, useEffect } from "react";

export const useCredentials = () => {
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    fetchAuthSession().then((session) => {
      setIdToken(session.tokens?.idToken?.toString() ?? null);
    });

    return () => {
      setIdToken(null);
    };
  }, []);

  return { idToken };
}