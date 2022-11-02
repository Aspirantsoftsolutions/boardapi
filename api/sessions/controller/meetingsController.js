import {
    ErrorResponseWithData,
    successResponseWithData,
} from "../../utils/apiResponse.js";

import { body, header, validationResult } from "express-validator";

import SessionModel from "../model/SessionModel.js";
import StudentModel from "../../user/model/StudentModel.js";
import mongoose from "mongoose";
import _ from 'lodash'
function makeid() {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

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
            const userAttendance = await SessionModel.findOne({ sessionId, 'attendance.user': mongoose.Types.ObjectId(user) }).lean();
            if (!userAttendance) {
                const updateAttendence = await SessionModel.updateOne({ sessionId }, { attendance: attendence });
                console.log(updateAttendence);
            }
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
        try {
            const { user, sessionId, writeAccess, teacherId } = req.body;
            let session = await SessionModel.findOne(
                { sessionId, teacherId }).lean();
            let newSessionId = makeid();
            if (session && !session.writeSessionId) {
                session = await SessionModel.updateOne(
                    { sessionId, teacherId },
                    {
                        $set: {
                            'writeSessionId': newSessionId
                        }
                    }, { new: true });
            }
            const userAttendence = await SessionModel.findOne({ sessionId, "attendance.user": user, teacherId });
            let sessionInfo;
            if (!userAttendence) {
                // sessionInfo = await SessionModel.updateOne(
                //     { sessionId, teacherId },
                //     {
                //         $push: {
                //             attendance: {
                //                 user,
                //                 writeAccess,
                //                 sessionId: (session && session.writeSessionId) ? session.writeSessionId : newSessionId
                //             }
                //         }
                //     }, { new: true });
                return ErrorResponseWithData(res, 'user is not logged into the meeting yet', {}, 400)
            } else {
                let updateQuery = {};
                if (writeAccess) {
                    updateQuery = {
                        'attendance.$.writeAccess': writeAccess,
                        'attendance.$.sessionId': (session && session.writeSessionId) ? session.writeSessionId : newSessionId
                    }
                } else {
                    updateQuery = {
                        'attendance.$.writeAccess': writeAccess,
                        'attendance.$.sessionId': '',
                        'attendance.$.huddle': ''
                    }
                }
                sessionInfo = await SessionModel.updateOne(
                    { sessionId, teacherId, "attendance.user": user },
                    {
                        $set: updateQuery
                    }, { new: true, upsert: true });
            }

            if (!sessionInfo.matchedCount) {
                return ErrorResponseWithData(res, 'No match sessions for given session id combination', {}, 400)
            }
            return successResponseWithData(res, 'success', sessionInfo);
        } catch (error) {
            console.log(error)
            return ErrorResponseWithData(res, error.message || 'No match sessions for given session id combination', {}, 400)
        }
    }
];

const attendence = [
    header('sessionId').notEmpty().isString().trim(),
    // header('teacherId').notEmpty().isString().trim(),
    async (req, res) => {
        try {
            const { sessionid, teacherid } = req.headers;
            const sessionInfo = await SessionModel.findOne({ sessionId: sessionid }, { _id: 0 }).populate('groupId').populate({ path: 'attendance.$.user', options: { projection: { _id: 0 } } }).lean();
            if (!sessionInfo) {
                return ErrorResponseWithData(res, 'No match sessions for given session id combination', {}, 400);
            }
            const externalInvite = sessionInfo && Object(sessionInfo).hasOwnProperty('participants') ? sessionInfo.participants.split(',').length : 0;
            const resp = {
                _id: sessionInfo._id,
                invited: externalInvite + sessionInfo.groupId.students.length,
                huddlemode: sessionInfo.huddlemode,
                attendance: [],
                attended: 0,
                defaultSessionId: sessionid,
                currentSessionId: sessionInfo.currentSessionId
            }
            const studentsPromArr = sessionInfo.groupId.students.map((user) => {
                return profile(user, {});
            });
            let students = await Promise.all(studentsPromArr);
            sessionInfo.attendance = sessionInfo.attendance.map(user => ({ ...user, loggedIn: true }));
            if (Object(sessionInfo).hasOwnProperty('attendance')) {
                const consolidated = students.map(student => {
                    student = { ...student, loggedIn: false, writeAccess: false, huddle: "", sessionId: "", user: student._id };
                    const temp = sessionInfo.attendance.find(session => session.user.toString() === student._id.toString());
                    temp ? delete temp._id : null;
                    student ? delete student._id : null;
                    return { ...student, ...temp }
                });
                resp.attendance = consolidated;
                resp.attended = sessionInfo.attendance.length;
                const huddleList = _.groupBy(resp.attendance, 'huddle');
                resp.huddles = Object.keys(huddleList).map((key) => ({
                    huddleId: key, users: huddleList[key].map(x => ({ ..._.omit(x, ['_id', 'sessionId', 'writeAccess', 'huddle']) }))
                }))
            }
            return successResponseWithData(res, 'success', resp);
        } catch (error) {
            console.log(error)
            return ErrorResponseWithData(res, error.message || 'No match sessions for given session id combination', {}, 400)
        }
    }
];

async function profile(_id) {
    return new Promise(async (resolve, reject) => {
        try {
            const userInfo = await StudentModel.findOne({ _id }, { username: 1, email: 1 }).lean();
            resolve(userInfo);
        } catch (error) {
            reject(error);
        }
    });
}

const huddle = [
    body('userId').isArray({ min: 1 }).withMessage('min 1 user id is required'),
    body('sessionId').notEmpty().isString().trim(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Display sanitized values/errors messages.
                return validationErrorWithData(
                    res,
                    AuthConstants.validationError,
                    errors.array()
                );
            } else {
                const { userId, sessionId } = req.body;
                const huddleId = makeid();
                const updates = Promise.all(userId.map(
                    usr => new Promise(async (resolve, reject) => {
                        resolve(await SessionModel.updateOne(
                            { sessionId, "attendance.user": usr },
                            {
                                $set: {
                                    'attendance.$.huddle': huddleId
                                }
                            }, { new: true }))
                    })));
                return successResponseWithData(res, 'success', updates);
            }
        } catch (error) {
            return ErrorResponseWithData(res, error.message, {}, 400);
        }
    }
];

const currentSession = [
    body('sessionId').notEmpty().isString().trim(),
    body('teacherId').notEmpty().isString().trim(),
    body('currentSessionId').notEmpty().isString().trim(),
    body('huddlemode').notEmpty().isBoolean().withMessage('Huddle mode is required'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Display sanitized values/errors messages.
                return validationErrorWithData(
                    res,
                    AuthConstants.validationError,
                    errors.array()
                );
            } else {
                const { teacherId, sessionId, currentSessionId, huddlemode } = req.body;
                const sessionInfo = await SessionModel.updateOne(
                    { sessionId, teacherId },
                    {
                        $set: {
                            currentSessionId,
                            huddlemode
                        }
                    }, { new: true });
                return successResponseWithData(res, 'success', sessionInfo);
            }
        } catch (error) {
            return ErrorResponseWithData(res, error.message, {}, 400);
        }
    }
];

export default {
    checkAccess,
    grantAccess,
    attendence,
    huddle,
    currentSession
};
