import admin from "firebase-admin";


import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("../../../sample-projecct-f10db-ca047fc264cc.json");
import validator from "express-validator";

const { body, validationResult } = validator;

/**
 * @description API Response Utility functions
 * @param {Function} successResponse - Success Response with message
 * @param successResponseWithData - Success Response with data
 * @param ErrorResponse - Error Response with message
 * @param ErrorResponseWithData - Error Response with data
 * @param validationErrorWithData - Validation Error with data
 * @param validationError - Validation Error with message
 * @param unauthorizedResponse - Unauthorized Error response handling
 * @param unprocessable - Unprocessable Error response handling
 */
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

/**
 * @description Notificaiton Constants
 * @param NotificaitonConstants
 */
import NotificaitonConstants from "../const.js";

import PushNotificationsClients from "../models/PushNotificationsClientsModel.js";
import NotificationsModel from "../models/NotificationsModel.js";

const firbaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sample-projecct-f10db.firebaseio.com/", // yet to be keep
});

const subscribe = [
  body("token", NotificaitonConstants.fcmTokenRequired).not().isEmpty(),
  body("device_id", NotificaitonConstants.deviceIdRequired).not().isEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorWithData(
          res,
          NotificaitonConstants.validationError,
          errors.array()
        );
      }
      const user = await PushNotificationsClients.findOne({
        deviceId: req.body.device_id,
      }).exec();
      if (user) {
        user.token = req.body.token;
        await user.save();
        return successResponse(
          res,
          NotificaitonConstants.userTokenUpdatedSuccessMsg
        );
      } else {
        const PushNotificationsClient = new PushNotificationsClients({
          userId: req.user._id,
          deviceId: req.body.device_id,
          token: req.body.token,
        });
        await PushNotificationsClient.save();
        return successResponse(
          res,
          NotificaitonConstants.userSubscribedSuccessMsg
        );
      }
    } catch (e) {
      return validationError(res, e.message());
    }
  },
];

const sendPush = [
  async (req, res) => {
    const registrationTokens = await PushNotificationsClients.find(
      {},
      {
        token: 1,
        _id: 0,
      }
    ).exec();
    let tokensArray = [];
    registrationTokens.forEach((value) => {
      tokensArray.push(value.token);
    });
    console.log(tokensArray);
    const message = {
      notification: {
        title: "Hello, There",
        body: "Whats up buddy",
      },
      data: {
        title: "Hello how are you",
      },
      tokens: tokensArray,
    };
    await firbaseApp
      .messaging()
      .sendMulticast(message)
      .then((response) => {
        console.log(response.successCount + " messages were sent successfully");
      });
    // await firbaseApp.messaging().send(message)
    // .then((response) => {
    //     console.log(response);
    // })
    return successResponse(res, "Messages sent");
  },
];

const sendPushNow = [
  async (title, body, image, icon) => {
    const registrationTokens = await PushNotificationsClients.find(
      {},
      {
        token: 1,
        _id: 0,
      }
    ).exec();
    let tokensArray = [];
    registrationTokens.forEach((value) => {
      tokensArray.push(value.token);
    });
    let message;
    if (icon && image) {
      message = {
        notification: {
          title: title,
          body: body,
          image: image,
        },
        android: {
          notification: {
            icon: icon,
            color: "#0000b3",
          },
        },
        tokens: tokensArray,
      };
    } else if (icon) {
      message = {
        notification: {
          title: title,
          body: body,
        },
        android: {
          notification: {
            icon: icon,
            color: "#0000b3",
          },
        },
        tokens: tokensArray,
      };
    } else if (image) {
      message = {
        notification: {
          title: title,
          body: body,
          image: image,
        },
        android: {
          notification: {
            color: "#0000b3",
          },
        },
        tokens: tokensArray,
      };
    } else {
      message = {
        notification: {
          title: title,
          body: body,
        },
        data: {
          View: "FantasyView",
          MatchId: "5f9b0affa7c39836ac5d118c",
          ContestId: "5f770d6b0edfd0083578d408",
        },
        // android: {
        //     notification: {
        //         icon: icon,
        //         color: '#0000b3'
        //     }
        // },
        tokens: tokensArray,
      };
    }
    let result = {};
    await firbaseApp
      .messaging()
      .sendMulticast(message)
      .then((response) => {
        console.log(response.successCount + " messages were sent successfully");
        result.successCount = response.successCount;
        result.failed = response.failureCount;
      })
      .catch((err) => {
        throw err;
      });
    return result;
  },
];

const add = [
  async (req, res) => {
    try {
      console.log(req.body);
      if (req.body) {
        const notification = await new NotificationsModel(req.body);
        notification.save();
        // if (notification.publishNow === true) {
        //   const notify = await this.sendPushNow(
        //     notification.title,
        //     notification.body,
        //     notification.image,
        //     notification.icon
        //   );
        //   notification.sucessCount = notify.sucessCount;
        //   notification.failsCount = notify.failed;
        //   notification.publishStatus = true;
        //   notification.save();
        // }
        return successResponseWithData(
          res,
          NotificaitonConstants.notificationAddedSuccessMsg,
          notification
        );
      }
    } catch (e) {
      return validationErrorWithData(
        res,
        NotificaitonConstants.errorOccurred,
        e
      );
    }
  },
];

const getNotifications = [
  async (req, res) => {
    try {
      const notifications = await NotificationsModel.find().exec();
      return successResponseWithData(
        res,
        NotificaitonConstants.notificaitonsFetchedSuccessMsg,
        notifications
      );
    } catch (e) {
      return validationErrorWithData(
        res,
        NotificaitonConstants.errorOccurred,
        e
      );
    }
  },
];

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    // Add a boolean
    await NotificationsModel.findByIdAndDelete(id);
    return successResponse(res, "Deleted Successfully");
  } catch (err) {
    console.log(err);
    return ErrorResponse(res, "Error on deletion");
  }
};

export default {
  getNotifications,
  add,
  sendPushNow,
  sendPush,
  subscribe,
  deleteNotification
};
