/**
 * @description Express Framework module
 * @param express
 */
 import express from "express";

 /**
  * @description File Upload Controller
  * @param fileUploadController
  */
 import upload from "../controller/FileUploadController.js";
 import fileUploadConstants from "../constants/FileUploadConstants.js";
 import uploadConfig from "../config/fileUploadConfig.js";
 import saveUserFilesInSchema from "../dao/FileUploadDBOperations.js";
 import {encryptFileName, decryptFileName} from "../encrypt_decrypt/EncryptDecryptFileNames.js";

 /**
  * @description Express Framework Router
  * @param Router
  */
 let FileUploadRouter = express.Router();

 /**
  * HTTP POST request to upload files to S3
  */
FileUploadRouter.post('/', upload.array(fileUploadConstants.FILE_FIELD_NAME, fileUploadConstants.maxNumberOfFilesAllowed ), (req, res) => {

    if (!req.files) {
        return res.status(fileUploadConstants.STATUS_CODE_400)
        .json({ error: fileUploadConstants.FILE_NOT_UPLOADED });
    }
    const hashedFileNames = [];
    (req.files).forEach(function(file){
      const hashKey = encryptFileName(file.location);
      hashedFileNames.push(hashKey.iv);
    });

    console.log(hashedFileNames);
    console.log(req.params.userId);
    if(saveUserFilesInSchema(req.params.userId,hashedFileNames) == "successfully saved") {
        return res.status(fileUploadConstants.STATUS_CODE_201)
        .json({
          message: fileUploadConstants.SUCCESSFULLY_ULOADED + req.files.length + fileUploadConstants.FILES_STR,
          files: req.files
        });
    }
    else{
        return res.status(fileUploadConstants.STATUS_CODE_500)
        .json({
          message: fileUploadConstants.FILE_NOT_UPLOADED
        });
    }
})
  

 /**
  * @description Configured router for Post Routes
  * @exports FileUploadRouter
  * @default
  */
 
 export default FileUploadRouter;
 