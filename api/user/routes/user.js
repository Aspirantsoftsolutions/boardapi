/**
 * @description Express Framework module
 * @param express
 */
import express from "express";

/**
 * @description User Controller
 * @param UserController
 */
import UserController from "../controller/UserController.js";

import AuthMiddleware from "../../../middlewares/auth.js";
// import upload from '../../../middlewares/upload.js';

/**
 * @description Express Framework Router
 * @param Router
 */
let userRouter = express.Router();

userRouter.get("/profile", AuthMiddleware.auth, UserController.getProfile);
// userRouter.put('/profile', auth, upload.fields([{
//     name: 'profile_pic',
//     maxCount: 1
// }]), UserController.updateProfile);
userRouter.get(
  "/refer/invite",
  AuthMiddleware.auth,
  UserController.sendReferral
);
userRouter.get(
  "/refer/fetch",
  AuthMiddleware.auth,
  UserController.fetchReferrals
);
userRouter.get("/all", UserController.allusers);
userRouter.put("/", AuthMiddleware.auth, UserController.updateProfile);
userRouter.delete("/:id", UserController.deleteUser);

/**
 * @description Configured router for User Routes
 * @exports userRouter
 * @default
 */
export default userRouter;
