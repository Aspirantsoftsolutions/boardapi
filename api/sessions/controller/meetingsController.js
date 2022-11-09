import {
    ErrorResponseWithData,
    successResponseWithData,
    validationErrorWithData,
} from "../../utils/apiResponse.js";

import { body, header, validationResult } from "express-validator";

import SessionModel from "../model/SessionModel.js";
import StudentModel from "../../user/model/StudentModel.js";
import _ from 'lodash';

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
        const sessionInfo = await SessionModel.findOne({ sessionId }).lean();
        const attendence = sessionInfo.attendance.map(invited => {
            if (invited.user.toString() === user) {
                resp.grantAccess = true;
                invited.loggedIn = true;
            }
            return invited
        });
        if (resp.grantAccess) {
            const updateAttendence = await SessionModel.updateOne({ sessionId }, { attendance: attendence });
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
                        'attendance.$.sessionId': ''
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
            const sessionInfo = await SessionModel.findOne({ sessionId: sessionid }, { _id: 0 });
            if (!sessionInfo) {
                return ErrorResponseWithData(res, 'No match sessions for given session id combination', {}, 400);
            }
            const externalInvite = sessionInfo && Object(sessionInfo).hasOwnProperty('participants') ? sessionInfo.participants.split(',').length : 0;
            const resp = {
                _id: sessionInfo._id,
                invited: externalInvite + (sessionInfo.creationType == 'normal' ? sessionInfo.attendance.length : 0),
                huddlemode: sessionInfo.huddlemode,
                attendance: [],
                attended: 0,
                defaultSessionId: sessionid,
                currentSessionId: sessionInfo.currentSessionId
            }
            resp.attendance = sessionInfo.attendance;
            resp.attended = sessionInfo.attendance.length;
            const huddleList = _.groupBy(resp.attendance, 'huddle');
            resp.huddles = Object.keys(huddleList).map((key) => ({
                huddleId: key, users: huddleList[key].map(x => ({ ..._.omit(x, ['_id', 'sessionId', 'writeAccess', 'huddle']) }))
            }));
            return successResponseWithData(res, 'success', resp);
        } catch (error) {
            console.log(error)
            return ErrorResponseWithData(res, error.message || 'No match sessions for given session id combination', {}, 400)
        }
    }
];

async function profile(_id, obj) {
    return new Promise(async (resolve, reject) => {
        try {
            const userInfo = await StudentModel.findOne({ _id }, { username: 1, email: 1 }).lean();
            resolve({ ...userInfo, ...obj });
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
                    'Validation Error',
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
                    'Validation Error',
                    errors.array()
                );
            } else {
                const { teacherId, sessionId, currentSessionId, huddlemode } = req.body;
                const sessionInfo = await SessionModel.findOne({ sessionId, teacherId }).lean();
                let updatedHuddle = sessionInfo.attendance;
                if (huddlemode) {
                    const huddleExist = sessionInfo.attendance.find(user => user.huddle != '');
                    if (sessionInfo.attendance.length && !huddleExist) {
                        const huddle = makeid();
                        updatedHuddle = sessionInfo.attendance.map(user => ({ ...user, huddle: huddle }));
                    }
                }
                const sessionUpdate = await SessionModel.updateOne(
                    { sessionId, teacherId },
                    {
                        $set: {
                            currentSessionId,
                            huddlemode,
                            attendance: updatedHuddle
                        }
                    }, { new: true });
                return successResponseWithData(res, 'success', sessionUpdate);
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
