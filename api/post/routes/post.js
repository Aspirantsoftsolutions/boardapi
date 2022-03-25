/**
 * @description Express Framework module
 * @param express
 */
import express from "express";

/**
 * @description Post Controller
 * @param PostController
 */
import PostController from "../controller/PostController.js";

// import { diskUpload } from "../../../middlewares/upload.js";

/**
 * @description Express Framework Router
 * @param Router
 */
let postRouter = express.Router();
postRouter.post("/", PostController.createPost);
postRouter.get("/", PostController.getPosts);
postRouter.get("/hashtags", PostController.fetchHastags);
postRouter.patch("/:postId", PostController.updatePosts);
postRouter.delete("/:postId", PostController.deletePost);
/**
 * @description Configured router for Post Routes
 * @exports postRouter
 * @default
 */

export default postRouter;
