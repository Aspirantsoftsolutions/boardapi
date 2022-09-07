/**
 * @description Express Framework module
 * @param express
 */
import express from "express";

/**
 * @description User Controller
 * @param SessionController
 */
import SessionController from "../controller/SessionController.js";

/**
 * @description Express Framework Router
 * @param Router
 */
let sessionRouter = express.Router();

// sessionRouter.put('/profile', auth, upload.fields([{
//     name: 'profile_pic',
//     maxCount: 1
// }]), SessionController.updateProfile);

sessionRouter.get("/all", SessionController.allsessions);
sessionRouter.get("/:id", SessionController.sessionsById);
sessionRouter.get("/students/:student_id", SessionController.sessionsByStudentId);
// sessionRouter.put("/", AuthMiddleware.auth, SessionController.updateProfile);
// sessionRouter.delete("/:id", SessionController.deleteUser);
sessionRouter.post("/createSession", SessionController.createSession);

/**
 * @description Configured router for User Routes
 * @exports sessionRouter
 * @default
 */
export default sessionRouter;
