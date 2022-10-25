/**
 * @description Express Framework module
 * @param express
 */
import express from "express";

/**
 * @description cloudIntegrations Controller
 * @param meetingsController
 */
import meetingsController from "../controller/meetingsController.js";

/**
 * @description Express Framework Router
 * @param Router
 */
let meetingsRouter = express.Router();


meetingsRouter.post('/checkAccess', meetingsController.checkAccess);
meetingsRouter.post('/grantAccess', meetingsController.grantAccess);
meetingsRouter.get('/attendence', meetingsController.attendence);
meetingsRouter.post('/huddle', meetingsController.huddle);
meetingsRouter.post('/currentSession', meetingsController.currentSession);

/**
 * @description Configured router for User Routes
 * @exports meetingsRouter
 * @default
 */
export default meetingsRouter;
