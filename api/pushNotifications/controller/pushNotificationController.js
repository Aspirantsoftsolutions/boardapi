import axios from "axios";
import validator from "express-validator";
import {
    ErrorResponseWithData,
    successResponseWithData,
    validationErrorWithData,
} from "../../utils/apiResponse.js";
const { body, validationResult, oneOf } = validator;
import pushNotificationModel from "../model/pushNotificationModels.js";
import devicesModel from "../../devices/models/devicesModel.js";
import { v4 as uuidv4 } from "uuid";
import deviceGroupsModel from "../../devices/models/deviceGroups.js";

const PushNotificaitonConstants = {
    title: "Notification titile is Required",
    body: "Notification body is Required",
    devices: "Device ID(s) is required and must be an array",
    userId: "user id is required and must be an array",
    deviceGroup: "Device ID(s) is required in group and must be an array",
    validationError: "Validation Error",
    command: "Command is required",
    startDate: 'Start date is required',
    endDate: 'End date is required',
    triggerTime: 'Trigger time is required',
    pushNotificationType: 'Notification type',
    url: 'Command url is required'
};

const add = [
    oneOf( // <-- one of the following must exist
        [
            body("to", PushNotificaitonConstants.devices)
                .not()
                .isEmpty()
                .isArray({ min: 1 }),
            body("deviceGroups", PushNotificaitonConstants.deviceGroup)
                .not()
                .isEmpty()
                .isArray({ min: 1 }),
        ],
    ),
    async (req, res) => {
        const jobId = uuidv4();
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return validationErrorWithData(
                    res,
                    PushNotificaitonConstants.validationError,
                    errors.array()
                );
            } else {
                let deviceIds = [];
                const totalPushNotifications = [];
                const { data, to, deviceGroups } = req.body;
                if (deviceGroups) {
                    const groupIds = deviceGroups.map(group => group._id);
                    const groups = await deviceGroupsModel.find({ _id: { $in: groupIds } }).populate({
                        path: 'devicesList',
                        model: 'devices'
                    }).lean();
                    groups.map(group => {
                        if (Array.isArray(group.devicesList)) {
                            deviceIds.push(...group.devicesList)
                        }
                    });
                    deviceIds = deviceIds.map(device => device.deviceid);
                    to.push(...deviceIds);
                }
                const finalList = [...new Set(to)]
                finalList.forEach((device) => {
                    totalPushNotifications.push({ title: data.title, description: data.description, deviceId: device, jobId, video: data.video_url, image: data.image_url });
                });
                const docs = await pushNotificationModel.insertMany(
                    totalPushNotifications
                );
                const promPushNotiArr = sendPushNotification(docs);
                const pushyResult = await Promise.all(promPushNotiArr);
                await setNotificationStatus(pushyResult);
                return successResponseWithData(res, "success", pushyResult);
            }
        } catch (error) {
            console.log(error);
        }
    },
];

function sendPushNotification(notifications) {
    const promNotiArr = [];
    notifications.forEach((notif) => {
        const payload = {
            to: [notif.deviceId],
            data: {
                title: notif.title,
                description: notif.description,
                image_url: notif.image,
                video_url: notif.video,
                command: notif.command,
                url: notif.commandURL
            },
            notification: {
                badge: 1,
            },
        };
        const req = axios
            .request({
                method: "POST",
                headers: {
                    Authorization: process.env.PUSHY_AUTH_KEY,
                },
                url: process.env.PUSHY_API,
                data: payload,
            })
            .then((resp) => ({ ...resp.data, deviceId: notif.deviceId }))
            .catch((e) => ({ ...e.response.data, deviceId: notif.deviceId }));
        promNotiArr.push(req);
    });
    return promNotiArr;
}

async function setNotificationStatus(pushyResp) {
    pushyResp.forEach(async (resp) => {
        let publishStatus = resp.hasOwnProperty('error') ? 'failed' : 'sent';
        const statusResp = await pushNotificationModel.findOneAndUpdate({ deviceId: resp.deviceId }, { publishStatus });
        return;
    });
    return;
}

const command = [
    body("to", PushNotificaitonConstants.devices)
        .not()
        .isEmpty()
        .isArray({ min: 1 }),
    body("command", PushNotificaitonConstants.command)
        .not()
        .isEmpty()
        .isString(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return validationErrorWithData(
                    res,
                    PushNotificaitonConstants.validationError,
                    errors.array()
                );
            } else {
                const { command, to } = req.body;
                const docs = await devicesModel.updateMany({ deviceid: { $in: to } }, { $set: { command } });
                const commands = to.map(x => ({ deviceId: x, command }));
                const promPushNotiArr = sendPushNotification(commands);
                const pushyResult = await Promise.all(promPushNotiArr);
                await setNotificationStatus(pushyResult);
                return successResponseWithData(res, "success", pushyResult);
            }
        } catch (error) {
            console.log(error);
        }
    },
];

const commandByClient = [
    body("to", PushNotificaitonConstants.userId)
        .not()
        .isEmpty()
        .isString({ min: 8 }),
    body("command", PushNotificaitonConstants.command)
        .not()
        .isEmpty()
        .isString(),
    body("url", PushNotificaitonConstants.url)
        .not()
        .isEmpty()
        .isString(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return validationErrorWithData(
                    res,
                    PushNotificaitonConstants.validationError,
                    errors.array()
                );
            } else {
                const { command, to, url } = req.body;
                let deviceList = await devicesModel.find({ school_id: to }, { deviceid: 1 });
                deviceList = deviceList.map(device => device.deviceid);
                const docs = await devicesModel.updateMany({ deviceid: { $in: deviceList } }, { $set: { command, commandURL: url } });
                const commands = deviceList.map(x => ({ deviceId: x, command, commandURL:url }));
                const promPushNotiArr = sendPushNotification(commands);
                const pushyResult = await Promise.all(promPushNotiArr);
                await setNotificationStatus(pushyResult);
                return successResponseWithData(res, "success", pushyResult);
            }
        } catch (error) {
            console.log(error);
        }
    },
];
const schedule = [
    oneOf( // <-- one of the following must exist
        [
            body("to", PushNotificaitonConstants.devices)
                .not()
                .isEmpty()
                .isArray({ min: 1 }),
            body("deviceGroups", PushNotificaitonConstants.deviceGroup)
                .not()
                .isEmpty()
                .isArray({ min: 1 })
        ]
    ),
    body("startDate", PushNotificaitonConstants.startDate)
        .not()
        .isEmpty()
        .isString(),
    body("endDate", PushNotificaitonConstants.endDate)
        .not()
        .isEmpty()
        .isString(),
    body("triggerTime", PushNotificaitonConstants.triggerTime)
        .not()
        .isEmpty()
        .isString(),
    body("type", PushNotificaitonConstants.pushNotificationType)
        .not()
        .isEmpty()
        .isString(),
    async (req, res) => {
        const jobId = uuidv4();
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return validationErrorWithData(
                    res,
                    PushNotificaitonConstants.validationError,
                    errors.array()
                );
            } else {
                let deviceIds = [];
                const totalPushNotifications = [];
                const { data, to, deviceGroups, startDate, endDate, triggerTime, type, command } = req.body;
                if (deviceGroups) {
                    const groupIds = deviceGroups.map(group => group._id);
                    const groups = await deviceGroupsModel.find({ _id: { $in: groupIds } }).populate({
                        path: 'devicesList',
                        model: 'devices'
                    }).lean();
                    groups.map(group => {
                        if (Array.isArray(group.devicesList)) {
                            deviceIds.push(...group.devicesList)
                        }
                    });
                    deviceIds = deviceIds.map(device => device.deviceid);
                    to.push(...deviceIds);
                }
                const finalList = [...new Set(to)];

                if (type === 'media') {
                    finalList.forEach((device) => {
                        totalPushNotifications.push({ title: data.title, description: data.description, deviceId: device, jobId, video: data.video_url, image: data.image_url, isScheduled: true, scheduleInfo: { startDate, endDate, triggerTime }, publishNow: false });
                    });
                } else if (type === 'command') {
                    finalList.forEach((device) => {
                        totalPushNotifications.push({ title: data.title, description: data.description, deviceId: device, jobId, 'command': command, isScheduled: true, scheduleInfo: { startDate, endDate, triggerTime }, publishNow: false });
                    });
                }

                const docs = await pushNotificationModel.insertMany(
                    totalPushNotifications
                );

                return successResponseWithData(res, "success", docs);
            }
        } catch (error) {
            return ErrorResponseWithData(res, error.message, error, 500);
        }
    },
];

async function setSchedulerNotificationStatus(pushyResp, startDate, time) {
    pushyResp.forEach(async (resp) => {
        let publishStatus = resp.hasOwnProperty('error') ? 'failed' : 'sent';
        const statusResp = await pushNotificationModel.updateMany({ deviceId: resp.deviceId, isScheduled: true, 'scheduleInfo.startDate': { "$lte": startDate }, 'scheduleInfo.triggerTime': { "$lte": `${time}` } }, { publishStatus, isScheduled: false });
        return;
    });
    return;
}

const runScheduler = [
    async (req, res) => {
        try {
            const startDate = new Date().toISOString();
            const time = new Date().toLocaleTimeString([], {
                hourCycle: 'h23',
                hour: '2-digit',
                minute: '2-digit'
            });
            const docs = await pushNotificationModel.find({
                "isScheduled": true,
                'scheduleInfo.startDate': { "$lte": `${startDate}` },
                'scheduleInfo.triggerTime': { "$lte": `${time}` }
            });
            const promPushNotiArr = sendPushNotification(docs);
            const pushyResult = await Promise.all(promPushNotiArr);
            await setSchedulerNotificationStatus(pushyResult, startDate, time);
            return successResponseWithData(res, 'success', pushyResult);
        } catch (error) {
            console.log(error);
            return ErrorResponseWithData(res, 'something bad happened', error, 500);
        }
    }
];


export default {
    add,
    command,
    commandByClient,
    schedule,
    runScheduler
};
