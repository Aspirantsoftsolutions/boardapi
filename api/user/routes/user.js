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
// userRouter.get(
//   "/refer/invite",
//   AuthMiddleware.auth,
//   UserController.sendReferral
// );
// userRouter.get(
//   "/refer/fetch",
//   AuthMiddleware.auth,
//   UserController.fetchReferrals
// );
userRouter.get("/all", UserController.allusers);
userRouter.get("/allTeachers/:schoolId", UserController.allTeachers);
userRouter.get("/allClasses/:schoolId", UserController.allClasses);
userRouter.get("/allStudents/:schoolId", UserController.allStudents);
userRouter.get("/all/:role", UserController.allusersRole);
userRouter.put("/", UserController.updateUser);
userRouter.put("/updatePassword", UserController.updateUserPassword);
userRouter.put("/updateProfileData", UserController.updateProfileData);
userRouter.delete("/:id", UserController.deleteUser);
userRouter.delete("/Teacher/:id", UserController.deleteTeacher);
userRouter.delete("/Student/:id", UserController.deleteStudent);
userRouter.put("/invite", UserController.sendInvitation);
userRouter.put("/userActive", AuthMiddleware.auth, UserController.updateUserStatus);
userRouter.get("/getCounts/:userid", UserController.getCounts);
userRouter.post("/createClass", UserController.createClass);
/**
 * @description Configured router for User Routes
 * @exports userRouter
 * @default
 */
export default userRouter;
