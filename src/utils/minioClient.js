import { S3Client } from "@aws-sdk/client-s3";

/**
 * @file minioClient.js
 * @description Cliente S3 para la conexión con MinIO.
 */

export const s3Client = new S3Client({
  endpoint: import.meta.env.VITE_MINIO_ENDPOINT,
  region: "mx-nort-1",
  credentials: {
    accessKeyId: import.meta.env.VITE_MINIO_ACCESS_KEY,
    secretAccessKey: import.meta.env.VITE_MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

export const BUCKET_NAME = import.meta.env.VITE_MINIO_BUCKET_NAME;