import { S3, DynamoDB } from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

export const dynamoDB = new DynamoDB.DocumentClient(config);
export const s3Client = new S3(config);

// Export constants
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME as string;
export const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME as string;

// Define cache TTL in seconds (24 hours default)
export const CACHE_TTL = parseInt(process.env.CACHE_TTL || '86400', 10);