import cloudIntegrationsModel from "../model/cloudIntegrationsModel.js";
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
    successResponseWithData,
    ErrorResponseWithData,
} from "../../utils/apiResponse.js";

import { body, query } from "express-validator";



const saveIntegration = [
    body('school_Id').notEmpty().isString().trim(),
    body('role').notEmpty().isString().trim(),
    body('user').notEmpty().isString().trim(),
    async (req, res) => {
        try {
            const resp = await cloudIntegrationsModel.update({ school_Id: req.body.school_Id, role: req.body.role }, { ...req.body }, { upsert: true });
            return successResponseWithData(res, 'successfully created', resp);
        } catch (error) {
            return ErrorResponseWithData(res, error.message, error, 500);
        }
    }
];


const getIntegrationDetailsById = [
    query('school_Id').notEmpty().isString().trim(),
    query('role').notEmpty().isString().trim(),
    query('user').notEmpty().isString().trim(),
    async (req, res) => {
        try {
            const { school_Id, role, user } = req.query;
            const resp = await cloudIntegrationsModel.findOne({ school_Id, role, user });
            return successResponseWithData(res, 'successfully fetched', resp);
        } catch (error) {
            return ErrorResponseWithData(res, error.message, error, 500);
        }
    }
];


export default {
    saveIntegration,
    getIntegrationDetailsById
};
