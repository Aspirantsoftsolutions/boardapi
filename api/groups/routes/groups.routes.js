
import express from "express";
import groupsController from '../controller/groups.controller.js';

let groupsRouter = express.Router();

// groupsRouter.post("/preSignURL", multiMediaController.preSignS3URL);
groupsRouter.post("/create", groupsController.createGroup);
groupsRouter.get("/:schoolId", groupsController.getGroups);
groupsRouter.get("/group/:groupId", groupsController.groupById);
groupsRouter.delete("/group/:groupId", groupsController.deleteGroup);

export default groupsRouter;
