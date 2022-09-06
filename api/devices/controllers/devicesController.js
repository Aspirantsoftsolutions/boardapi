import devicesModel from "../models/devicesModel.js";
import { body, param, validationResult } from "express-validator";
import deviceConstants from "../const.js";
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
        .not()
        .isEmpty()
        .isString()
        .isLength({ min: 5 })
        .trim()
        .withMessage(deviceConstants.deviceTypeError),
    body("ip")
        .not()
        .isEmpty()
        .isString()
        .isLength({ min: 7 })
        .withMessage(deviceConstants.ipNotProvided),
    body("school_id")
        .not()
        .isEmpty()
        .isString()
        .isLength({ min: 7 })
        .withMessage(deviceConstants.school_id),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const saveRec = await devicesModel.create({ deviceid: req.body.deviceid, ip: req.body.ip, school_id: req.body.school_id, deviceName: req.body.name });
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

const getDevicesByID = [
    param("id").not().isEmpty().isLength({ min: 12 }),
    async (req, res) => {
        try {
            const devices = await devicesModel.find({ school_id: req.params.id });
            return successResponseWithData(res, 'success', devices);
        } catch (error) {
            console.log(error);
            return internalServerError(res, 'Unable to fetch devices');
        }
    }]

export default {
    createDevice,
    getDevices,
    getDevicesByID
};
