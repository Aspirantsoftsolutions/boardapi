
import express from "express";
import multiMediaController from '../controller/multimedia.controller.js';

let multiMediaRouter = express.Router();

// multiMediaRouter.post("/preSignURL", multiMediaController.preSignS3URL);
multiMediaRouter.post("/upload/:id", multiMediaController.uploadFiles);
multiMediaRouter.get("/list/:id", multiMediaController.mediaList);
multiMediaRouter.delete("/:id", multiMediaController.deleteMedia);

export default multiMediaRouter;
