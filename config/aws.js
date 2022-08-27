import { S3Client } from "@aws-sdk/client-s3";
const s3Client = new S3Client(
    {
        region: 'us-east-1',
        credentials: {
            accessKeyId: 'AKIARBF3UHUUTUZJ2FM5',
            secretAccessKey: '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'
        }
    }
);
export { s3Client };