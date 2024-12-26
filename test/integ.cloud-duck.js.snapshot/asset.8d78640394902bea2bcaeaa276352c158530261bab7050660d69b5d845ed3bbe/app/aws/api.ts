import { TableData } from "duckdb";
import { useCredentials } from "./useCredentials";
import { useEffect, useState } from "react";
const API_URL = import.meta.env.VITE_API_ROOT;

if (!API_URL) {
  throw new Error("VITE_API_ROOT is not defined");
}

export const useGetApi = () => {
  const { idToken } = useCredentials();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!idToken) {
      return;
    }

    const fetchData = async () => {
      const res = await fetch(`${API_URL}/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json();
      setData(data);
    };

    fetchData();

    return () => {
      setData(null);
    };
  }, [idToken]);

  return { data };
};

export const useListBuckets = () => {
  const { idToken } = useCredentials();
  const [data, setData] = useState<string[] | null>(null);

  useEffect(() => {
    if (!idToken) {
      return;
    }

    const fetchData = async () => {
      const res = await fetch(`${API_URL}/buckets`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json();
      setData(data);
    };

    fetchData();

    return () => {
      setData(null);
    };
  }, [idToken]);

  return { data };
};

export const useGetPreSignedUrls = (bucket: string, prefix: string) => {
  const { idToken } = useCredentials();
  const [data, setData] = useState<string[] | null>(null);

  useEffect(() => {
    if (!idToken || !bucket || !prefix) {
      return;
    }

    const fetchData = async () => {
      const res = await fetch(
        `${API_URL}/objects?bucket=${bucket}&prefix=${prefix}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      const data = await res.json();
      setData(data);
    };

    fetchData();

    return () => {
      setData(null);
    };
  }, [idToken, bucket, prefix]);

  return { data };
};
export const useDuckDb = (sql: string) => {
  const { idToken } = useCredentials();
  const [data, setData] = useState<TableData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!idToken || !sql) {
      return;
    }

    setIsLoading(true);

    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/duckdb`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            sql,
          }),
        });
        const data: TableData = await res.json();
        setData(data);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      setData(null);
      setIsLoading(false);
    };
  }, [idToken, sql]);

  return { data, isLoading };
};
