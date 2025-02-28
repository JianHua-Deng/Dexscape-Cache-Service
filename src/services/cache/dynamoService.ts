import AWS from "aws-sdk";

AWS.config.update({
  region: process.env.AWS_REGION!,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE_NAME!;

