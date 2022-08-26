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
deviceRouter.post("/", deviceController.createDevice);
deviceRouter.get("/", deviceController.getDevices);
// deviceRouter.get("/:type", deviceController.fetchReport);
/**
 * @description Configured router for Report Routes
 * @exports deviceRouter
 * @default
 */

export default deviceRouter;
