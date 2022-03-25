/**
 * @description Express Framework module
 * @param express
 */
import express from 'express';

/**
 * @description Banners Controller
 * @param AdminController
 */
import AdminController from '../controller/AdminController.js';

/**
 * @description Express Framework Router
 * @param Router
 */
let adminRouter = express.Router();

adminRouter.post('/register', AdminController.register);
adminRouter.post('/login', AdminController.login);

/**
 * @description Configured router for Banner Routes
 * @exports adminRouter
 * @default
 */
export default adminRouter;