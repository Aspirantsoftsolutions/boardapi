import SessionModel from "../model/SessionModel.js";

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

import validator from "express-validator";

const { body, validationResult } = validator;

/**
 * @description User Constants
 * @param SessionConstants
 */
import {
  SessionConstants
} from "../const.js";

/**
 * Get all Sessions
 */
const allsessions = async (req, res) => {
  try {
    let sessions = await SessionModel.find().exec();
    return successResponseWithData(
      res,
      SessionConstants.userFetchedSuccessfully,
      sessions
    );
  } catch (e) {
    return validationErrorWithData(res, SessionConstants.errorOccurred, e);
  }
};

const createSession = [
  body("groupId")
  .isString()
  .trim()
  .withMessage(SessionConstants.validGroupIDIDMSg)
  .escape(),
  body("teacherId")
  .isString()
  .trim()
  .withMessage(SessionConstants.validTeacherIDMSg)
  .escape(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorWithData(
          res,
          SessionConstants.validationError,
          errors.array()
        );
      } else {
          console.log("Registering session");
        const {
            title,
            groupId,
            description,
            teacherId
          } = req.body;

          const createData = {
            groupId,
            description,
            teacherId
          }

          createData.title = title;
          createData.groupId = groupId;
          createData.description = description;
          createData.teacherId = teacherId;

          console.log("createData : " + createData.groupId);
          try {
            const sessionData = await SessionModel.create(createData);

            console.log("sessionData : " + sessionData);
            let sessionResponse = {};
           sessionResponse = {
             tokenId: sessionData.sessionId,
             sessionLink: "http://65.108.95.12:50021/boards/"+sessionData.sessionId,
           }
             await SessionModel.updateOne({sessionId:sessionData.sessionId},{sessionLink: "http://65.108.95.12:50021/boards/"+sessionData.sessionId},
              (err, session) => {
                console.log(session);
              });
            console.log("Sending response to user");
            return successResponseWithData(
              res,
              SessionConstants.registrationSuccessMsg,
              sessionResponse
            );
          } catch (err) {
            console.log(err)
            if (err.code === 11000) {
              let str = "";
              Object.keys(err.keyPattern).forEach((d) => {
                str += `${d}, `;
              });
              str = str.slice(0, str.length - 2);
              return unauthorizedResponse(res, str + " already taken");
            }
          }
        
      }
    } catch (err) {
      return ErrorResponse(res, err);
    }
  },
];

/**
 *  Delete user
 *  @param {string} userId
 */
const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    // Add a boolean

    await SessionModel.findByIdAndDelete(id);
    return successResponse(res, SessionConstants.userDeletedSuccessfully);
  } catch (err) {
    return ErrorResponse(res, SessionConstants.errorOccurred);
  }
};
export default {
  allsessions,
  deleteSession,
  createSession
};
