import express from "express";
import analyticsController from "./analytics.controller.js";

let analyticsRouter = express.Router();

// analyticsRouter.get('/payments', analyticsController.adminAnalytics);
analyticsRouter.get('/adminAnalytics', analyticsController.adminAnalytics);
analyticsRouter.get('/schoolAnalytics', analyticsController.schoolActivity);

export default analyticsRouter;
