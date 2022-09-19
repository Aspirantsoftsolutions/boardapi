import gradesModel from "../models/grades.models.js";
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
const gradeConstants = {
    name: 'grade name is required',
    school_id: 'school id is required',
    grade_id: 'grade id is required'
}
const createGrade = [
    body('name').notEmpty().isString().trim().withMessage(gradeConstants.name),
    body('school_id').notEmpty().isString().trim().withMessage(gradeConstants.school_id),
    async (req, res) => {
        try {
            const { name, school_id } = req.body;
            const resp = await gradesModel.create({ name, school_id });
            return successResponseWithData(res, 'grade created successfully', resp);
        } catch (error) {
            console.log(error);
            return ErrorResponseWithData(res, 'someting bad happened', error, 500);
        }
    }
];
const getGrades = [
    param('schoolId').notEmpty().isString().trim().withMessage(gradeConstants.name),
    async (req, res) => {
        try {
            const resp = await gradesModel.find({ school_id: req.params.schoolId }).lean();
            return successResponseWithData(res, 'fetched grades successfully', resp);
        } catch (error) {
            console.log(error);
            return ErrorResponseWithData(res, 'something bad happened', error, 500);
        }
    }
];

const gradeById = [
    param('gradeId').notEmpty().isString().trim().withMessage(gradeConstants.grade_id),
    async (req, res) => {
        try {
            const resp = await gradesModel.findOne({ _id: req.params.gradeId }).lean();
            return successResponseWithData(res, 'fetched grades successfully', resp);
        } catch (error) {
            console.log(error);
            return ErrorResponseWithData(res, 'something bad happened', error, 500);
        }
    }
];

const deleteByID = [
    param('gradeId').notEmpty().isString().trim().withMessage(gradeConstants.grade_id),
    async (req, res) => {
        try {
            const resp = await gradesModel.deleteOne({ _id: req.params.gradeId }).lean();
            return successResponseWithData(res, 'Deleted grade successfully', resp);
        } catch (error) {
            console.log(error);
            return ErrorResponseWithData(res, 'something bad happened', error, 500);
        }
    }
];

const updateByID = [
    param('gradeId').notEmpty().isString().trim().withMessage(gradeConstants.grade_id),
    body('name').notEmpty().isString().trim().withMessage(gradeConstants.name),
    async (req, res) => {
        try {
            const resp = await gradesModel.updateOne({ _id: req.params.gradeId }, { name: req.body.name }).lean();
            return successResponseWithData(res, 'Deleted grade successfully', resp);
        } catch (error) {
            console.log(error);
            return ErrorResponseWithData(res, 'something bad happened', error, 500);
        }
    }
];

export default {
    createGrade,
    getGrades,
    gradeById,
    deleteByID,
    updateByID
};
