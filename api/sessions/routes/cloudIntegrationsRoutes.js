/**
 * @description Express Framework module
 * @param express
 */
import express from "express";

/**
 * @description cloudIntegrations Controller
 * @param cloudIntegrationsController
 */
import cloudIntegrationsController from "../controller/cloudIntegrationsController.js";

/**
 * @description Express Framework Router
 * @param Router
 */
let cloudIntegrationRouter = express.Router();


cloudIntegrationRouter.post('', cloudIntegrationsController.saveIntegration);
cloudIntegrationRouter.get('', cloudIntegrationsController.getIntegrationDetailsById);

/**
 * @description Configured router for User Routes
 * @exports cloudIntegrationRouter
 * @default
 */
export default cloudIntegrationRouter;
