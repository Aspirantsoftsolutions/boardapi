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
 * @param notificationRouter
 */
let notificationRouter = express.Router();

import AuthMiddleware from "../../../middlewares/auth.js";

notificationRouter.post(
  "/subscribe",
  AuthMiddleware.auth,
  NotificationsController.subscribe
);
notificationRouter.post("/add", NotificationsController.add);
notificationRouter.get("/send", NotificationsController.sendPush);
notificationRouter.get("/all", NotificationsController.getNotifications);
notificationRouter.get("/all/:id", NotificationsController.getNotificationsById);
notificationRouter.delete("/:id", NotificationsController.deleteNotification);
notificationRouter.post("/markAllAsRead/:id", NotificationsController.markAllAsRead);
/**
 * @description Configured router for Notification Routes
 * @exports notificationRouter
 * @default
 */
export default notificationRouter;

