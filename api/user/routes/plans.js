import express from "express";

import UserController from "../controller/UserController.js";

import AuthMiddleware from "../../../middlewares/auth.js";
import plansController from "../controller/plansController.js";

let planRouter = express.Router();

planRouter.get("/", plansController.getPlans);
planRouter.post("/", plansController.updatePlans);

export default planRouter;