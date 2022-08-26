import devicesModel from "../models/devicesModel.js";
import { body, validationResult } from "express-validator";
import deviceConstants from "../const.js";
import { s3Client } from "../../../config/aws.js";
import { PutObjectCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import {
    successResponse,
    successResponseWithData,
    ErrorResponse,
    ErrorResponseWithData,
    notFoundResponse,
    validationErrorWithData,
    validationError,
    unauthorizedResponse,
    unprocessable,
} from "../../utils/apiResponse.js";

const createDevice = [
    body("deviceid")
        .isString()
        .isLength({ min: 5 })
        .trim()
        .withMessage(deviceConstants.deviceTypeError),
    body("ip")
        .isString()
        .isLength({ min: 7 })
        .withMessage(deviceConstants.ipNotProvided),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const saveRec = await devicesModel.create({ deviceid: req.body.deviceid, ip: req.body.ip });
            return successResponseWithData(res, 'success', saveRec);
        } catch (error) {
            console.log(error);
            return internalServerError(res, 'Unable to save device information');
        }
    },
];
const getDevices = [async (req, res) => {
    try {
        const devices = await devicesModel.find({});
        return successResponseWithData(res, 'success', devices);
    } catch (error) {
        console.log(error);
        return internalServerError(res, 'Unable to fetch devices');
    }
}]

export default {
    createDevice,
    getDevices
};
