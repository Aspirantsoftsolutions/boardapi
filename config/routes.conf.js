import authRouter from "../api/auth/routes/auth.js";
import userRouter from "../api/user/routes/user.js";
import sessionRouter from "../api/sessions/routes/sessions.js";
// import searchRouter from "../api/search/routes/search.js";
import reportRouter from "../api/report/routes/report.js";
import FileUploadRouter from "../api/fileupload/routes/FileUpload.js";

import AuthMiddleware from "../middlewares/auth.js";
// import adminRouter from "../api/admin/routes/admin.js";
import notificationsRouter from "../api/notifications/routes/notifications.js";
import devicesRouter from "../api/devices/routes/devicesRoutes.js";
import pushNotificationsRouter from "../api/pushNotifications/routes/pushNotificationRoutes.js";
/**
 * Init routes config
 * @param app
 */
export function initRoutes(app) {
  const startTime = new Date();

  // Insert routes below

  app.use("/api/auth", authRouter);
  // app.use("/api/admin/", adminRouter);
  app.use("/api/user", userRouter);
  app.use("/api/session", sessionRouter);
  app.use("/api/notificaitons/", notificationsRouter);
  // app.use("/api/search", searchRouter);
  app.use("/api/report", AuthMiddleware.auth, reportRouter);
  app.use("/api/fileupload", FileUploadRouter);
  app.use("/api/device", devicesRouter);
  app.use("/api/pushnotifications", pushNotificationsRouter);

  app.route("/*").get((req, res) => {
    res.status(404).end();
  });
}
