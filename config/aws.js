import { S3Client } from "@aws-sdk/client-s3";
const s3Client = new S3Client(
    {
        region: 'us-east-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESSKEY,
            secretAccessKey: process.env.AWS_SECRET
        }
    }
);
export { s3Client };