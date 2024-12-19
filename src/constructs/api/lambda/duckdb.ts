import * as duckdb from "duckdb";
import * as fs from "node:fs";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { APIGatewayProxyEvent } from "aws-lambda";

const getObjectFromS3 = async (
  s3Client: S3Client,
  bucket: string,
  key: string
): Promise<Buffer> => {
  const s3Object = await s3Client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );
  const streamToBuffer = (stream: any) =>
    new Promise<Buffer>((resolve, reject) => {
      const chunks: any[] = [];
      stream.on("data", (chunk: any) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  return streamToBuffer(s3Object.Body);
};

const s3Client = new S3Client({});
const s3Bucket = process.env.S3_BUCKET;
if (!s3Bucket) {
  throw new Error("S3_BUCKET environment variable is required");
}

exports.handler = async (event: APIGatewayProxyEvent) => {
  const { sql } = JSON.parse(event.body ?? "{}");
  if (!sql) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ message: "SQL is required" }),
    };
  }

  const userId = event.requestContext.authorizer?.claims.sub ?? "unknown";
  const dbFilePath = `/tmp/${userId}.duckdb`;

  // Check if the DB file exists in S3
  try {
    const bodyContents = await getObjectFromS3(
      s3Client,
      s3Bucket,
      `${userId}.duckdb`
    );
    fs.writeFileSync(dbFilePath, bodyContents);
    console.log(`Downloaded ${userId}.duckdb from S3`);
  } catch (error) {
    console.log(
      `No existing DB file found in S3 for ${userId}, creating a new one`
    );
  }

  const db = new duckdb.Database(dbFilePath);
  const connection = db.connect();
  console.log("Connected to database");

  const query = (queryString: string): Promise<duckdb.TableData> => {
    return new Promise((resolve, reject) => {
      connection.all(queryString, (err, res) => {
        if (err) reject(err);
        resolve(res);
      });
    });
  };

  try {
    await query(`PRAGMA version;`);
    await query(`SET home_directory='/tmp';`);
    await query(`
      INSTALL aws;
      LOAD aws;
      INSTALL httpfs;
      LOAD httpfs;
      CREATE SECRET (
        TYPE S3,
        PROVIDER CREDENTIAL_CHAIN
      );
    `);
    const result = await query(sql);
    connection.close();

    // Upload the DB file back to S3
    const dbFileContent = fs.readFileSync(dbFilePath);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3Bucket,
        Key: `${userId}.duckdb`,
        Body: dbFileContent,
      })
    );
    console.log(`Uploaded ${userId}.duckdb to S3`);

    return {
      statusCode: 200,
      body: JSON.stringify(result, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value
      ),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    };
  } catch (error) {
    console.error("Error executing SQL query or uploading DB file:", error);
    connection.close();

    // Upload the DB file back to S3
    const dbFileContent = fs.readFileSync(dbFilePath);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3Bucket,
        Key: `${userId}.duckdb`,
        Body: dbFileContent,
      })
    );
    console.log(`Uploaded ${userId}.duckdb to S3`);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    };
  }
};
