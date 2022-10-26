import express from "express";
import analyticsController from "./analytics.controller.js";

let analyticsRouter = express.Router();

analyticsRouter.get('/payments', analyticsController.paymentAnalytics);
analyticsRouter.get('/loginActivity', analyticsController.loginActivity);

export default analyticsRouter;
