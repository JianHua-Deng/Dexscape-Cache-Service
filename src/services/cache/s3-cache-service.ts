import { s3Client, S3_BUCKET_NAME, CACHE_TTL } from "../aws-config";
import { CacheOptions } from "../../utils/types";
import { generateS3ImageKey } from "../../utils/utils";
import axios from 'axios';
import { HeadObjectCommand, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

export class S3ImageCache {

  // Check if image already exists in S3 bucket
  async exists(url: string): Promise<boolean> {
    try {
      const key = generateS3ImageKey(url);
      const command = new HeadObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      // If object doesn't exist, headObject throws an error
      return false;
    }
  }

  // Get an image from S3 based on url (returns a pre-signed URL)
  async getUrl(url: string, expiry: number = 3600): Promise<string | null> {
    try {
      const key = generateS3ImageKey(url);

      if (!(await this.exists(url))) {
        return null;
      }

      const command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: expiry });
      return signedUrl;
    } catch (error) {
      console.error(`Error getting image from S3 bucket`, error);
      return null;
    }
  }
  
  // Cache an image in S3 bucket
  async cacheImage(url: string, responseBuffer: Buffer, contentType: string): Promise<void> {
    try {
      const key = generateS3ImageKey(url);
      //console.log(`Storing image Key: ${key}` );

      // Upload to s3 bucket
      const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: responseBuffer,
        ContentType: contentType,
        CacheControl: `max-age=${CACHE_TTL}`,
      });

      await s3Client.send(command);
      return;

    } catch (error) {
      console.error('Error caching image to S3:', error);
      return;
    }
  }

  // Delete an image from the S3 bucket
  async delete(url: string): Promise<void> {
    try {
      const key = generateS3ImageKey(url);
      
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error('Error deleting image from S3:', error);
    }
  }
}

// Explicitly exporting default new, such so that we are not creating multiple instances of S3ImageCache when doing multiple imports in multiple files
// By doing this, all imports are referencing the same instance
export default new S3ImageCache();