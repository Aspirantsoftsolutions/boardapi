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
 * @description search Constants
 * @param searchConstants
 */
import userModel from "../../user/model/UserModel.js";
import searchConstants from "../const.js";

/**
 * search operation.
 *
 * @query_param {string}      context=(mix/users)
 * @query_param {string}      keyword
 *
 * @returns {Object}
 */

const performSearch = [
  async (req, res) => {
    if (!req.query.key) {
      return successResponse(res, searchConstants.emptySearchKey);
    }
    try {
      if (req.query.context === "users") {
        // fetch matching usernames of the user
        const users = await userModel.aggregate([
          {
            $match: {
              username: { $regex: new RegExp(req.query.key), $options: "i" },
            },
          },
          {
            $project: {
              _id : false,
              username: true,
              profile_pic: true,
            },
          },
        ]);
        //send the response
        return successResponseWithData(res, searchConstants.usersFound, users);
      } 
    } catch (err) {
      console.log(err);
      return ErrorResponse(res, friendshipsConstants.canNotFetch);
    }
  },
];

export default {
  performSearch,
};
