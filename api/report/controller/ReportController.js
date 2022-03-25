import ReportModel, { supportedReportTypes } from "../model/ReportModel.js";

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

import validator, { body } from "express-validator";

const { param, validationResult } = validator;

/**
 * @description Report Constants
 * @param ReportConstants
 */
import reportConstants from "../const.js";

/**
 *  Create Report
 *
 */
const createReport = [
  body("reportCollection")
    .isString()
    .trim()
    .escape()
    .withMessage(reportConstants.reportTypeError),
  body("id")
    .isString()
    .trim()
    .escape()
    .withMessage(reportConstants.idNotProvided),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Display sanitized values/errors messages.
      return validationErrorWithData(
        res,
        postConstants.validationError,
        errors.array()
      );
    } else {
      const { user } = req;
      const userId = user._id;
      try {
        const { reportCollection, id } = req.body;

        if (!supportedReportTypes.includes(reportCollection)) {
          return ErrorResponse(res, reportConstants.reportTypeError);
        }

        await ReportModel.create({
          reporter: userId,
          reportCollection: reportCollection,
          [reportCollection]: id,
        });

        return successResponse(res, reportConstants.reported);
      } catch (err) {
        console.log(err);
        return ErrorResponse(res, postConstants.postCannotBeCreated);
      }
    }
  },
];

/**
 *  Fetch Reports
 *
 */
const fetchReport = [
  param("type")
    .isString()
    .trim()
    .escape()
    .withMessage(reportConstants.reportTypeError),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Display sanitized values/errors messages.
      return validationErrorWithData(
        res,
        postConstants.validationError,
        errors.array()
      );
    } else {
      try {
        const { type } = req.params;

        if (!supportedReportTypes.includes(type)) {
          return ErrorResponse(res, reportConstants.reportTypeError);
        }
        const reportData = await ReportModel.find({
          reportCollection: type,
        }).lean();

        return successResponseWithData(res, reportConstants.reportFetched, {
          reportData,
        });
      } catch (err) {
        console.log(err);
        return ErrorResponse(res, reportConstants.reportFetchedError);
      }
    }
  },
];

export default {
  createReport,
  fetchReport,
};
