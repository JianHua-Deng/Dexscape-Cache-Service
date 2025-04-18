
import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
};

export const dynamoDBClient = new DynamoDBClient(config);
export const s3Client = new S3Client(config);

// Export constants
export const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME as string;
export const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME as string;

// Define cache TTL in seconds (24 hours default)
export const CACHE_TTL = parseInt(process.env.CACHE_TTL || '86400', 10);