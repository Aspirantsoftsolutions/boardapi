import AdminModel from "../model/AdminModel.js";
import { body } from "express-validator";

/**
 * @description API Response Utility functions
 * @param {Function} successResponse - Success Response with message
 * @param successResponseWithData - Success Response with data
 * @param ErrorResponse - Error Response with message
 * @param ErrorResponseWithData - Error Response with data
 * @param validationErrorWithData - Validation Error with data
 * @param validationError - Validation Error with message
 * @param unauthorizedResponse - Unauthorized Error response handling
 * @param unprocessable - Unprocessable Error response handling
 */
import {
  successResponse,
  successResponseWithData,
  ErrorResponse,
  ErrorResponseWithData,
  notFoundResponse,
  validationErrorWithData,
  validationError,
  unauthorizedResponse,
  unprocessable,
} from "../../utils/apiResponse.js";

/**
 * @description Admin Constants
 * @param AdminConstants
 */
import { AdminConstants } from "../const.js";

const login = [
  body("email")
    .isLength({
      min: 6,
    })
    .trim()
    .isEmail()
    .withMessage(AdminConstants.emailRequired),
  body("password")
    .isLength({
      min: 6,
    })
    .trim()
    .withMessage(AdminConstants.passwordRequired),
  //start the job here
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await AdminModel.findByCredentials(email, password);
      if (!user) {
        return ErrorResponse(res, AdminConstants.userNotFound);
      } else {
        const token = await user.generateAuthToken();
        return successResponseWithData(res, AdminConstants.loginSuccessfull, {
          user,
          token,
        });
      }
    } catch (err) {
      return ErrorResponse(res, err);
    }
  },
];

register = [
  body("email")
    .isLength({
      min: 6,
    })
    .trim()
    .isEmail()
    .withMessage(AdminConstants.emailRequired),
  body("password")
    .isLength({
      min: 6,
    })
    .trim()
    .withMessage(AdminConstants.passwordRequired),
  body("role")
    .isLength({
      min: 6,
    })
    .trim()
    .withMessage(AdminConstants.roleRequired),
  /*as always start the job here
   */
  async (req, res) => {
    try {
      const admin = new AdminModel(req.body);
      await admin.save();
      return successResponseWithData(
        res,
        AdminConstants.userCreatedSuccessfully,
        admin
      );
    } catch (err) {
      return ErrorResponse(res, err);
    }
  },
];

export { login, register };

