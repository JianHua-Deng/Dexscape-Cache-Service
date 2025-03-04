import { generateCacheKey, getExpirationTime } from "../../utils/utils";
import { dynamoDBClient, DYNAMODB_TABLE_NAME, CACHE_TTL } from "../aws-config";
import { GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { CacheItem } from "../../utils/types";

export class DynamoDBCache {

  // Get cached data from Dynamodb
  async get(key: string): Promise<any | null> {

    try {
      const cacheKey = generateCacheKey(key);
      //console.log(`Cache Key: ${cacheKey}`);
      const command = new GetCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Key: { key: cacheKey },
      });

      const result = await dynamoDBClient.send(command);
      //console.log(result);

      // Check if an item was found
      if (!result || !result.Item) {
        return null;
      }

      const cacheItem = result.Item as CacheItem;
      const now = Math.floor(Date.now() / 1000); // Current time in seconds

      // Check if cache is expired but hasn't been cleaned up by DynamoDB TTL yet
      if (cacheItem.ttl && cacheItem.ttl < now) {
        return null; // Item is expired, just don't use it
      }

      return cacheItem.data;

    } catch (error) {
      console.error("Error getting item", error);
    }
  }


  // Set item to DynamoDB
  async set(key: string, data: any): Promise<void>{

    try {
      const cacheKey = generateCacheKey(key);
      const ttl = CACHE_TTL || 18000
      const expirationTime = getExpirationTime(ttl);
  
  
      const cacheItem: CacheItem = {
        key: cacheKey,
        data: data,
        createdAt: new Date().toISOString(),
        ttl: expirationTime
      }
  
      const command = new PutCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Item: cacheItem,
      });
      
      await dynamoDBClient.send(command);

    } catch (error) {
      console.error("Error setting item to DynamoDB", error);
    }

  }

  // Delete a cached item
  async delete(key: string): Promise<void> {
    try {
      const cacheKey = generateCacheKey(key);
      const command = new DeleteCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Key: { key: cacheKey }
      });

      await dynamoDBClient.send(command);

    } catch (error) {
      console.error("Error deleting object", error);
    }
  }

}


export default new DynamoDBCache();
