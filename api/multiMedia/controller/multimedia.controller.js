import axios from "axios";
import validator, { param } from "express-validator";
import fs from 'fs';
import path from "path";
import { Blob } from "buffer";
const { body } = validator;
import { s3Client } from "../../../config/aws.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import upload from './fileUpload.js'
import multimediaModel from "../model/multimedia.model.js";
import { ErrorResponseWithData, successResponseWithData } from "../../utils/apiResponse.js";
const preSignS3URL = [
    async () => {
        try {
            const fileName = uuidv4();
            const url = await getPreSignS3URL(fileName, 'image/png');
            console.log(url);
            const resp = await axios.request({
                method: 'PUT',
                url: signedUrl,
                headers: {
                    'Content-Type': 'image/png'
                },
                body: new Blob([fs.readFileSync(path.resolve('err.png'))])
            });

            // return signedUrl;

            console.log(signedUrl);
            console.log(resp);
        } catch (error) {
            console.log(error);
        }
    },
];

async function getPreSignS3URL(fileName, fileType) {
    const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        ContentType: fileType,
    };
    const command = new PutObjectCommand(s3Params);
    try {
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return signedUrl;
    } catch (err) {
        console.error(err);
    }
}

const uploadFiles = [
    param("id").not().isEmpty().isLength({ min: 12 }),
    upload.array('image', 1), async (req, res) => {
        /* This will be the response sent from the backend to the frontend */
        try {
            const userid = req.params.id;
            const fileInfo = {
                type: req.file.mimetype,
                name: req.fileName,
                location: encodeURI(`https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${req.fileName}`),
                school_id: userid
            }
            const saveRec = await multimediaModel.create(fileInfo);
            if (saveRec) {
                res.send({ image: req.fileName });
            }
        } catch (error) {
            return ErrorResponseWithData(res, 'internal server error', error, 500)
        }
    }];

const mediaList = [
    param("id").not().isEmpty().isLength({ min: 12 }),
    async (req, res) => {
        try {
            const userid = req.params.id;
            const list = await multimediaModel.find({ school_id: userid }).lean();
            if (list) {
                return successResponseWithData(res, 'fetched successfully', list);
            }
        } catch (error) {
            return ErrorResponseWithData(res, 'internal server error', error, 500)
        }
    }
];

export default {
    preSignS3URL,
    uploadFiles,
    mediaList
};
