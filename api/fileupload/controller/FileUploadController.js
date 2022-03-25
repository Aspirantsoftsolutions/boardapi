/**
 * Imports
 */
import aws from "aws-sdk";
import multer from "multer";
import multerS3 from "multer-s3";
import uploadConfig from "../config/fileUploadConfig.js";
// import UserSchema from "../model/UserSchema.js";
import constants from "../constants/FileUploadConstants.js";

/**
 * Initializing S3 Client
 */
const s3 = new aws.S3({
  accessKeyId: uploadConfig.AWS_ACCESS_KEY,
  secretAccessKey: uploadConfig.SECRET_KEY,
  region: uploadConfig.REGION
});

/**
 * Uploading file to S3
 */

 const upload =  multer({
    storage: multerS3({
      s3: s3,
      bucket: uploadConfig.BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname })
      },
      key: (req, file, cb) => {
        cb(null, Date.now().toString() + constants.DASH_STR +file.originalname)
      }
    })
  })
     

export default upload