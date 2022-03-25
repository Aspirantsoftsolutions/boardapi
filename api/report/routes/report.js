/**
 * @description Express Framework module
 * @param express
 */
import express from "express";

/**
 * @description Report Controller
 * @param ReportController
 */
import ReportController from "../controller/ReportController.js";

// import { diskUpload } from "../../../middlewares/upload.js";

/**
 * @description Express Framework Router
 * @param Router
 */
let reportRouter = express.Router();
reportRouter.post("/", ReportController.createReport);
reportRouter.get("/:type", ReportController.fetchReport);
/**
 * @description Configured router for Report Routes
 * @exports reportRouter
 * @default
 */

export default reportRouter;
