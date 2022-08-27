/**
 * @description Express Framework module
 * @param express
 */
import express from "express";

/**
 * @description Report Controller
 * @param pushNotificationsController
 */
import pushNotificationsController from '../controller/pushNotificationController.js';

// import { diskUpload } from "../../../middlewares/upload.js";

/**
 * @description Express Framework Router
 * @param Router
 */
let pushNotificationsRouter = express.Router();
pushNotificationsRouter.post("/add", pushNotificationsController.add);
// pushNotificationsRouter.get("/:type", pushNotificationsController.fetchReport);
/**
 * @description Configured router for Report Routes
 * @exports pushNotificationsRouter
 * @default
 */

export default pushNotificationsRouter;
