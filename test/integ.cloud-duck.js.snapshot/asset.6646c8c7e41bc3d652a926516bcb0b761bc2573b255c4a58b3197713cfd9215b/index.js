"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// index.ts
var duckdb = __toESM(require("duckdb"));
var fs = __toESM(require("node:fs"));
var path = __toESM(require("node:path"));
var import_client_s3 = require("@aws-sdk/client-s3");
var syncS3WithLocal = async (s3Client2, bucket, prefix, localDir) => {
  const s3Keys = await listObjectsFromS3(s3Client2, bucket, prefix);
  const localFiles = fs.readdirSync(localDir).map((file) => `${prefix}/${file}`);
  const filesToDelete = s3Keys.filter((key) => !localFiles.includes(key));
  for (const key of filesToDelete) {
    await s3Client2.send(new import_client_s3.DeleteObjectCommand({ Bucket: bucket, Key: key }));
    console.log(`Deleted file from S3: ${key}`);
  }
};
var getObjectFromS3 = async (s3Client2, bucket, key) => {
  const s3Object = await s3Client2.send(new import_client_s3.GetObjectCommand({ Bucket: bucket, Key: key }));
  const streamToBuffer = (stream) => new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
  return streamToBuffer(s3Object.Body);
};
var listObjectsFromS3 = async (s3Client2, bucket, prefix) => {
  const listObjectsCommand = new import_client_s3.ListObjectsV2Command({ Bucket: bucket, Prefix: prefix });
  const response = await s3Client2.send(listObjectsCommand);
  return response.Contents?.map((item) => item.Key).filter((key) => key !== void 0) ?? [];
};
var downloadFilesFromS3 = async (s3Client2, bucket, prefix, localDir) => {
  const keys = await listObjectsFromS3(s3Client2, bucket, prefix);
  for (const key of keys) {
    const filePath = path.join(localDir, key.replace(prefix, ""));
    const fileContent = await getObjectFromS3(s3Client2, bucket, key);
    fs.writeFileSync(filePath, fileContent);
    console.log(`Downloaded file from S3: ${filePath}`);
  }
};
var uploadFilesToS3 = async (s3Client2, bucket, prefix, localDir) => {
  const entries = fs.readdirSync(localDir);
  for (const entry of entries) {
    const entryPath = path.join(localDir, entry);
    const stats = fs.statSync(entryPath);
    if (stats.isFile() && fs.existsSync(entryPath)) {
      const fileContent = fs.readFileSync(entryPath);
      await s3Client2.send(new import_client_s3.PutObjectCommand({
        Bucket: bucket,
        Key: `${prefix}/${entry}`,
        Body: fileContent
      }));
      console.log(`Uploaded file to S3: ${entryPath}`);
    } else {
      console.log(`Skipping non-file entry: ${entryPath}`);
    }
  }
};
var s3Client = new import_client_s3.S3Client({});
var s3Bucket = process.env.S3_BUCKET;
if (!s3Bucket) {
  throw new Error("S3_BUCKET environment variable is required");
}
exports.handler = async (event) => {
  const { sql } = JSON.parse(event.body ?? "{}");
  if (!sql) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({ message: "SQL is required" })
    };
  }
  const userId = event.requestContext.authorizer?.claims.sub ?? "unknown";
  const userDir = `/tmp/${userId}`;
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir);
    console.log(`Created directory for user: ${userDir}`);
  }
  try {
    await downloadFilesFromS3(s3Client, s3Bucket, userId, userDir);
  } catch (error) {
    console.log(`No existing files found in S3 for ${userId}, starting fresh`);
  }
  const dbFilePath = path.join(userDir, "db.duckdb");
  const db = new duckdb.Database(dbFilePath);
  const connection = db.connect();
  console.log("Connected to database");
  const query = (queryString) => {
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
      body: JSON.stringify(
        result,
        (_key, value) => typeof value === "bigint" ? value.toString() : value
      ),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    };
  } catch (error) {
    console.error("Error executing SQL query or uploading DB file:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error instanceof Error ? error.message : String(error)
      }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    };
  } finally {
    connection.close();
    await uploadFilesToS3(s3Client, s3Bucket, `${userId}`, userDir);
    console.log(`Uploaded all files to S3 for ${userId}`);
    await syncS3WithLocal(s3Client, s3Bucket, `${userId}`, userDir);
  }
};
