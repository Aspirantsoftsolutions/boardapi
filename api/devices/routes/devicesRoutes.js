/**
 * @description Express Framework module
 * @param express
 */
import express from "express";

/**
 * @description Report Controller
 * @param deviceController
 */
import deviceController from './../controllers/devicesController.js';

// import { diskUpload } from "../../../middlewares/upload.js";

/**
 * @description Express Framework Router
 * @param Router
 */
let deviceRouter = express.Router();
deviceRouter.post("/groups", deviceController.createDeviceGroup);
deviceRouter.get("/groups/:schoolId", deviceController.fetchDeviceGroups);
deviceRouter.delete("/group/:deviceId", deviceController.deleteDeviceFromGroup);
deviceRouter.delete("/groups/:groupId", deviceController.deleteDeviceGroup);
deviceRouter.post("/", deviceController.createDevice);
deviceRouter.get("/", deviceController.getDevices);
deviceRouter.get("/:id", deviceController.getDevicesByID);
deviceRouter.delete("/:id", deviceController.deleteDevice);
deviceRouter.post("/:id", deviceController.updateDevice);
deviceRouter.post("/command/:id", deviceController.command);
deviceRouter.get("/:schoolId/:deviceId", deviceController.getSingleDevicesByID);
// deviceRouter.get("/:type", deviceController.fetchReport);
/**
 * @description Configured router for Report Routes
 * @exports deviceRouter
 * @default
 */

export default deviceRouter;
