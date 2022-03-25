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
authRouter.post("/login", AuthController.login);
authRouter.post("/verify-otp", AuthController.verifyConfirm);
authRouter.post("/resend-verify-otp", AuthController.resendConfirmOtp);
authRouter.post("/refresh-token", AuthController.refreshToken);
authRouter.get("/check-username/:username", AuthController.checkUsername);
authRouter.put("/reset-password",AuthController.resetPassword);

/**
 * @description Configured router for Auth Routes
 * @exports authRouter
 * @default
 */
export default authRouter;

