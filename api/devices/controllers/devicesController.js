import devicesModel from "../models/devicesModel.js";
import deviceGroupsModel from "../models/deviceGroups.js";
import { body, param, validationResult } from "express-validator";
import deviceConstants from "../const.js";
import {
    successResponseWithData,
    ErrorResponse,
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
}];

const getDevicesByID = [
    param("id").not().isEmpty().isLength({ min: 12 }),
    async (req, res) => {
        try {
            const devices = await devicesModel.find({ school_id: req.params.id });
            return successResponseWithData(res, 'success', devices);
        } catch (error) {
            console.log(error);
            return ErrorResponse(res, 'Unable to fetch devices');
        }
    }];

const deleteDevice = [
    param("id").not().isEmpty().isLength({ min: 12 }),
    async (req, res) => {
        try {
            console.log(req.params.id);
            const device = await devicesModel.deleteOne({ _id: req.params.id });
            return successResponseWithData(res, 'success', device);
        } catch (error) {
            console.log(error);
            return ErrorResponse(res, 'Unable to delete device');
        }
    }
];

const updateDevice = [
    param("id").notEmpty().isLength({ min: 12 }),
    body("name").notEmpty().isLength({ min: 12 }),
    async (req, res) => {
        try {
            const device = await devicesModel.updateOne({ _id: req.params.id }, { deviceName: req.body.deviceName });
            return successResponseWithData(res, 'success', device);
        } catch (error) {
            console.log(error);
            return ErrorResponse(res, 'Unable to update device');
        }
    }
];

const command = [
    param("id").notEmpty().isLength({ min: 12 }),
    body('command').notEmpty().isString(),
    async (req, res) => {
        try {
            const device = await devicesModel.updateOne({ _id: req.params.id }, { $set: { command: req.body.command } });
            return successResponseWithData(res, 'success', device);
        } catch (error) {
            console.log(error);
            return ErrorResponse(res, 'Unable to send command to device');
        }
    }
];

const createDeviceGroup = [
    body("groupName").notEmpty().isLength({ min: 3 }),
    body("school_id").notEmpty().isLength({ min: 12 }),
    body('devices').notEmpty().isArray(),
    async (req, res) => {
        try {
            const device = await deviceGroupsModel.create({ groupName: req.body.groupName, devicesList: req.body.devices, school_id: req.body.school_id });
            return successResponseWithData(res, 'group created successfully', device);
        } catch (error) {
            console.log(error);
            return ErrorResponse(res, 'Unable to created group');
        }
    }
];

const fetchDeviceGroups = [
    param("schoolId").notEmpty().isLength({ min: 12 }),
    async (req, res) => {
        try {
            const devices = await deviceGroupsModel.find({ school_id: req.params.schoolId }).populate({
                path: 'devicesList',
                model: 'devices'
            }).lean();
            return successResponseWithData(res, 'fetched groups successfully', devices);
        } catch (error) {
            console.log(error);
            return ErrorResponse(res, 'Unable to fetch groups');
        }
    }
];
export default {
    createDevice,
    getDevices,
    getDevicesByID,
    deleteDevice,
    updateDevice,
    command,
    createDeviceGroup,
    fetchDeviceGroups
};
