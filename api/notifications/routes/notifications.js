/**
 * @description Express Framework module
 * @param express
 */
import express from "express";

/**
 * @description Notification Controller
 * @param NotificationsController
 */
import NotificationsController from "../controllers/NotificationsController.js";

/**
 * @description Express Framework Router
 * @param notificaitonRouter
 */
let notificaitonRouter = express.Router();

import AuthMiddleware from "../../../middlewares/auth.js";

notificaitonRouter.post(
  "/subscribe",
  AuthMiddleware.auth,
  NotificationsController.subscribe
);
notificaitonRouter.post("/add", NotificationsController.add);
notificaitonRouter.get("/send", NotificationsController.sendPush);
notificaitonRouter.get("/all", NotificationsController.getNotifications);
notificaitonRouter.delete("/:id", NotificationsController.deleteNotification);
/**
 * @description Configured router for Notification Routes
 * @exports notificaitonRouter
 * @default
 */
export default notificaitonRouter;

