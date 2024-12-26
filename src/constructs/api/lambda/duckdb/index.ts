import * as duckdb from "duckdb";
import * as fs from "node:fs";
import * as path from "node:path";
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { APIGatewayProxyEvent } from "aws-lambda";

const syncS3WithLocal = async (s3Client: S3Client, bucket: string, prefix: string, localDir: string) => {
  const s3Keys = await listObjectsFromS3(s3Client, bucket, prefix);
  const localFiles = fs.readdirSync(localDir).map(file => `${prefix}/${file}`);

  // S3 に存在するがローカルに存在しないファイルを特定
  const filesToDelete = s3Keys.filter(key => !localFiles.includes(key));
  // ローカルに存在しないファイルを S3 から削除
  for (const key of filesToDelete) {
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    console.log(`Deleted file from S3: ${key}`);
  }
};

const getObjectFromS3 = async (s3Client: S3Client, bucket: string, key: string): Promise<Buffer> => {
  const s3Object = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const streamToBuffer = (stream: any) =>
    new Promise<Buffer>((resolve, reject) => {
      const chunks: any[] = [];
      stream.on("data", (chunk: any) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  return streamToBuffer(s3Object.Body);
};

const listObjectsFromS3 = async (s3Client: S3Client, bucket: string, prefix: string): Promise<string[]> => {
  const listObjectsCommand = new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix });
  const response = await s3Client.send(listObjectsCommand);
  return response.Contents?.map(item => item.Key).filter((key): key is string => key !== undefined) ?? [];
};

const downloadFilesFromS3 = async (s3Client: S3Client, bucket: string, prefix: string, localDir: string) => {
  const keys = await listObjectsFromS3(s3Client, bucket, prefix);
  for (const key of keys) {
    const filePath = path.join(localDir, key.replace(prefix, ""));
    const fileContent = await getObjectFromS3(s3Client, bucket, key);
    fs.writeFileSync(filePath, fileContent);
    console.log(`Downloaded file from S3: ${filePath}`);
  }
};

const uploadFilesToS3 = async (s3Client: S3Client, bucket: string, prefix: string, localDir: string) => {
  const entries = fs.readdirSync(localDir);
  for (const entry of entries) {
    const entryPath = path.join(localDir, entry);
    const stats = fs.statSync(entryPath);

    if (stats.isFile() && fs.existsSync(entryPath)) {
      const fileContent = fs.readFileSync(entryPath);
      await s3Client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: `${prefix}/${entry}`,
        Body: fileContent,
      }));
      console.log(`Uploaded file to S3: ${entryPath}`);
    } else {
      console.log(`Skipping non-file entry: ${entryPath}`);
    }
  }
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
  const userDir = `/tmp/${userId}`;
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir);
    console.log(`Created directory for user: ${userDir}`);
  }

  // Download all files from S3 to /tmp/${userId}
  try {
    await downloadFilesFromS3(s3Client, s3Bucket, userId, userDir);
  } catch (error) {
    console.log(`No existing files found in S3 for ${userId}, starting fresh`);
  }

  const dbFilePath = path.join(userDir, "db.duckdb");
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
    return {
      statusCode: 200,
      body: JSON.stringify(result, (_key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    };
  } catch (error) {
    console.error("Error executing SQL query or uploading DB file:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error instanceof Error ? error.message : String(error),
      }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    };
  } finally {
    // connection close後に.walファイルが残ってたり削除されたりする。
    // そのため、connection close後に/tmpとS3を同期する。
    connection.close();
    // Upload all files from /tmp to S3
    await uploadFilesToS3(s3Client, s3Bucket, `${userId}`, userDir);
    console.log(`Uploaded all files to S3 for ${userId}`);
    // S3上の不要なファイルを削除
    await syncS3WithLocal(s3Client, s3Bucket, `${userId}`, userDir);
  }
};
