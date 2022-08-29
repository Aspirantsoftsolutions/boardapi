import axios from "axios";
import validator from "express-validator";
import {
    successResponseWithData,
    validationErrorWithData,
} from "../../utils/apiResponse.js";
const { body, validationResult } = validator;
import pushNotificationModel from "../model/pushNotificationModels.js";
import { v4 as uuidv4 } from "uuid";

const PushNotificaitonConstants = {
    title: "Notification titile is Required",
    body: "Notification body is Required",
    devices: "Device ID(s) is required and must be an array",
    validationError: "Validation Error",
};

const add = [
    body("data.title", PushNotificaitonConstants.title).not().isEmpty(),
    body("data.description", PushNotificaitonConstants.body).not().isEmpty(),
    body("to", PushNotificaitonConstants.devices)
        .not()
        .isEmpty()
        .isArray({ min: 1 }),
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
                const totalPushNotifications = [];
                const { data, to } = req.body;
                to.forEach((device) => {
                    totalPushNotifications.push({ title: data.title, description: data.description, deviceId: device, jobId });
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

export default {
    add,
};
