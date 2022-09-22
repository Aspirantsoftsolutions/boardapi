/**
 * @description Express Framework module
 * @param express
 */
import express from "express";

/**
 * @description Auth Controller
 * @param AuthController
 */
import AuthController from "../controller/AuthController.js";

/**
 * @description Express Framework Router
 * @param Router
 */
let authRouter = express.Router();

authRouter.post("/register", AuthController.register);
authRouter.post("/universalRegister", AuthController.UniversalRegister);
authRouter.post("/registerTeacher", AuthController.registerTeacher);
authRouter.post("/registerStudent", AuthController.registerStudent);
authRouter.post("/bulkRegisterTeacher", AuthController.bulkRegisterTeacher);
authRouter.post("/bulkRegisterStudent", AuthController.bulkRegisterStudent);
authRouter.post("/login", AuthController.login);
authRouter.post("/social-login", AuthController.socialLogin);
authRouter.post("/qrlogin", AuthController.qrlogin);
authRouter.post("/qrlogout", AuthController.qrlogout);
authRouter.post("/qrSessionStatus", AuthController.qrSessionStatus);
authRouter.post("/verify-otp", AuthController.verifyConfirm);
authRouter.post("/resend-verify-otp", AuthController.resendConfirmOtp);
authRouter.post("/refresh-token", AuthController.refreshToken);
authRouter.get("/check-username/:username", AuthController.checkUsername);
authRouter.put("/reset-password", AuthController.resetPassword);

/**
 * @description Configured router for Auth Routes
 * @exports authRouter
 * @default
 */
export default authRouter;

