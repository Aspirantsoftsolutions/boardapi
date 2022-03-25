/**
 * @description Express Framework module
 * @param express
 */
import express from "express";
import AuthMiddleware from "../../../middlewares/auth.js";
/**
 * @description search Controller
 * @param searchsController
 */
import searchController from "../controller/searchController.js";

/**
 * @description Express Framework Router
 * @param search Router
 */
let searchRouter = express.Router();
// route will have query params /recommendations/?context= and querytext=
searchRouter.get(
  "/recommendations",
  AuthMiddleware.auth,
  searchController.performSearch
);

/**
 * @description Configured router for search Routes
 * @exports searchRouter
 * @default
 */
export default searchRouter;
