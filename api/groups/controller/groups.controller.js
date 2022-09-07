import groupsModel from "../models/groups.models.js";
import { body, param, validationResult } from "express-validator";
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
const groupConstants = {
    name: 'group name is required',
    school_id: 'school id is required',
    group_id: 'school id is required'
}
const createGroup = [
    body('name').notEmpty().isString().trim().withMessage(groupConstants.name),
    body('school_id').notEmpty().isString().trim().withMessage(groupConstants.school_id),
    async (req, res) => {
        try {
            const { name, school_id, id, students } = req.body;
            if (id) {
                const resp = await groupsModel.update({ _id: id }, { name, school_id, students });
                return successResponseWithData(res, 'group updated successfully', resp);
            }
            const resp = await groupsModel.create({ name, school_id, students });
            return successResponseWithData(res, 'group created successfully', resp);
        } catch (error) {
            console.log(error);
            return ErrorResponseWithData(res, 'someting bad happened', error, 500);
        }
    }
];
const getGroups = [
    param('schoolId').notEmpty().isString().trim().withMessage(groupConstants.name),
    async (req, res) => {
        try {
            const resp = await groupsModel.find({ school_id: req.params.schoolId }).lean();
            return successResponseWithData(res, 'fetched groups successfully', resp);
        } catch (error) {
            console.log(error);
            return ErrorResponseWithData(res, 'something bad happened', error, 500);
        }
    }
];
const groupById = [
    param('groupId').notEmpty().isString().trim().withMessage(groupConstants.group_id),
    async (req, res) => {
        try {
            const resp = await groupsModel.findOne({ _id: req.params.groupId }).lean();
            return successResponseWithData(res, 'fetched groups successfully', resp);
        } catch (error) {
            console.log(error);
            return ErrorResponseWithData(res, 'something bad happened', error, 500);
        }
    }
];

export default {
    createGroup,
    getGroups,
    groupById
};
