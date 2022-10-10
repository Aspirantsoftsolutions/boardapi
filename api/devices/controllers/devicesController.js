import devicesModel from "../models/devicesModel.js";
import deviceGroupsModel from "../models/deviceGroups.js";
import { body, param, validationResult } from "express-validator";
import deviceConstants from "../const.js";
import {
    successResponseWithData,
    ErrorResponse,
} from "../../utils/apiResponse.js";
import mongoose from "mongoose";

const groupConstants = {
    name: 'group name is required',
    school_id: 'school id is required',
    group_id: 'school id is required',
    deviceId: 'deviceId is required'
}

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
            const saveRec = await devicesModel.updateOne({ deviceid: req.body.deviceid, school_id: req.body.school_id }, { deviceid: req.body.deviceid, ip: req.body.ip, school_id: req.body.school_id, deviceName: req.body.name, deviceUserName: req.body.deviceUserName, devicePass: req.body.devicePass }, { upsert: true });
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

const getSingleDevicesByID = [
    param("schoolId").not().isEmpty().isLength({ min: 12 }),
    param("deviceId").not().isEmpty().isLength({ min: 12 }),
    async (req, res) => {
        try {
            const devices = await devicesModel.find({ school_id: req.params.schoolId, deviceid: req.params.deviceId });
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
    body("deviceName").notEmpty().isLength({ min: 12 }),
    body("deviceUserName").notEmpty().isLength({ min: 12 }),
    body("devicePass").notEmpty().isLength({ min: 12 }),
    async (req, res) => {
        try {
            const device = await devicesModel.updateOne({ _id: req.params.id }, { deviceName: req.body.deviceName, deviceUserName: req.body.deviceUserName, devicePass: req.body.devicePass });
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

const deleteDeviceFromGroup = [
    param('groupId').notEmpty().isString().trim().withMessage(groupConstants.group_id),
    body('deviceId').notEmpty().isString().trim().withMessage(groupConstants.deviceId),
    async (req, res) => {
        try {
            const resp = await deviceGroupsModel.updateOne({ _id: req.params.groupId }, { $pull: { devicesList: req.body.deviceId } }).lean();
            return successResponseWithData(res, 'deleted group member successfully', resp);
        } catch (error) {
            console.log(error);
            return ErrorResponseWithData(res, 'something bad happened', error, 500);
        }
    }
]

const deleteDeviceGroup = [
    param('groupId').notEmpty().isString().trim().withMessage(groupConstants.group_id),
    async (req, res) => {
        try {
            const resp = await deviceGroupsModel.deleteOne({ _id: req.params.groupId });
            return successResponseWithData(res, 'deleted group member successfully', resp);
        } catch (error) {
            console.log(error);
            return ErrorResponseWithData(res, 'something bad happened', error, 500);
        }
    }
]

const saveBulkCreds = [
    body('devices').notEmpty().isArray({ min: 1 }).withMessage('min 1 devices is required'),
    body('userName').notEmpty().isString().trim().withMessage('username for devices is required'),
    body('password').notEmpty().isString().trim().withMessage('password for devices is required'),
    async (req, res) => {
        try {
            const resp = await devicesModel.updateMany({ _id: { $in: req.body.devices.map(x => mongoose.Types.ObjectId(x)) } }, { deviceUserName: req.body.userName, devicePass: req.body.password });
            return successResponseWithData(res, 'upadted successfully', resp);
        } catch (error) {
            console.log(error);
            return ErrorResponseWithData(res, 'something bad happened', error, 500);
        }
    }
]

export default {
    createDevice,
    getDevices,
    getDevicesByID,
    deleteDevice,
    updateDevice,
    command,
    createDeviceGroup,
    fetchDeviceGroups,
    deleteDeviceFromGroup,
    getSingleDevicesByID,
    deleteDeviceGroup,
    saveBulkCreds
};
