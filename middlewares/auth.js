import jwt from "jsonwebtoken";
import User from "./../api/user/model/UserModel.js";

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
} from "../api/utils/apiResponse.js";

const auth = async (req, res, next) => {
  try {
    if (req.header("Authorization")) {
      const token = req.header("Authorization").replace("Bearer ", "");
      const data = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({
        _id: data._id,
        mobile: data.mobile,
      });

      if (!user) {
        throw new Error();
      }
      req.user = user;
      req.token = token;
      next();
    } else {
      throw new Error();
    }
  } catch (error) {
    console.log(error);
    return unauthorizedResponse(res, "Not authorized to access this resource");
  }
};

export default {
  auth,
};
