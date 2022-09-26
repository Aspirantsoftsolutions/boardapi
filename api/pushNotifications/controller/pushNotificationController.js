import axios from "axios";
import validator from "express-validator";
import {
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
    deviceGroup: "Device ID(s) is required in group and must be an array",
    validationError: "Validation Error",
    command: "Command is required",
    startDate: 'Start date is required',
    endDate: 'End date is required',
    triggerTime: 'Trigger time is required'
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
                command: notif.command
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
                const { data, to, deviceGroups, startDate, endDate, triggerTime } = req.body;
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
                    totalPushNotifications.push({ title: data.title, description: data.description, deviceId: device, jobId, video: data.video_url, image: data.image_url, isScheduled: true, scheduleInfo: { startDate, endDate, triggerTime }, publishNow: false });
                });
                const docs = await pushNotificationModel.insertMany(
                    totalPushNotifications
                );

                return successResponseWithData(res, "success", docs);
            }
        } catch (error) {
            console.log(error);
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
        }
    }
];


export default {
    add,
    command,
    schedule,
    runScheduler
};
