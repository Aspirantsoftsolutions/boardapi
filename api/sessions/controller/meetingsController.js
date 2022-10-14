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

import { body, param, query, header, validationResult } from "express-validator";

import SessionModel from "../model/SessionModel.js";
import mongoose from "mongoose";

const checkAccess = [
    body('user').notEmpty().isString().trim(),
    body('sessionId').notEmpty().isString().trim(),
    async (req, res) => {
        const resp = {
            grantAccess: false
        };
        const { user, sessionId } = req.body;
        const sessionInfo = await SessionModel.findOne({ sessionId }).populate({
            path: 'groupId',
            populate: {
                path: 'students',
                model: 'Student'
            }
        }).lean();
        const inviteesArr = sessionInfo.groupId.students;
        const invitee = inviteesArr.find(invitee => invitee._id.toString() === user);
        if (invitee) {
            resp.grantAccess = true;
            const attendence = sessionInfo.attendance || [];
            attendence.push({ user, writeAccess: false });
            const updateAttendence = await SessionModel.updateOne({ sessionId }, { attendance: attendence });
            console.log(updateAttendence);
        }
        return successResponseWithData(res, 'success', resp);
    }
];
const grantAccess = [
    body('user').notEmpty().isString().trim(),
    body('sessionId').notEmpty().isString().trim(),
    body('writeAccess').notEmpty().isBoolean(),
    body('teacherId').notEmpty().isString().trim(),
    async (req, res) => {
        const { user, sessionId, writeAccess, teacherId } = req.body;
        const sessionInfo = await SessionModel.updateOne(
            { sessionId, "attendance.user": user, teacherId },
            {
                $set: {
                    'attendance.$.writeAccess': writeAccess
                }
            }, { new: true });
        if (sessionInfo.nModified && sessionInfo.ok) {
            return successResponseWithData(res, 'success', sessionInfo);
        }
        return ErrorResponseWithData(res, 'not found', sessionInfo, 400);
    }
];
const attendence = [
    header('sessionId').notEmpty().isString().trim(),
    header('teacherId').notEmpty().isString().trim(),
    async (req, res) => {
        const { sessionid, teacherid } = req.headers;
        const sessionInfo = await SessionModel.findOne({ sessionId: sessionid, teacherId: teacherid }, { attendance: 1, groupId: 1, participants: 1 }).populate('groupId');
        const externalInvite = sessionInfo.participants ? sessionInfo.participants.split(',').length : 0;
        const resp = {
            _id: sessionInfo._id,
            invited: externalInvite + sessionInfo.groupId.students.length,
            attendance: sessionInfo.attendance,
            attended: sessionInfo.attendance.length
        }
        return successResponseWithData(res, 'success', resp);
    }
];
export default {
    checkAccess,
    grantAccess,
    attendence
};
