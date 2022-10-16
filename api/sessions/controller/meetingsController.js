import {
    successResponseWithData,
} from "../../utils/apiResponse.js";

import { body, header } from "express-validator";

import SessionModel from "../model/SessionModel.js";
import StudentModel from "../../user/model/StudentModel.js";

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
                    'attendance.$.writeAccess': writeAccess,
                    'attendance.$.sessionId': makeid()
                }
            }, { new: true });
        return successResponseWithData(res, 'success', sessionInfo);
    }
];

const attendence = [
    header('sessionId').notEmpty().isString().trim(),
    header('teacherId').notEmpty().isString().trim(),
    async (req, res) => {
        const { sessionid, teacherid } = req.headers;
        const sessionInfo = await SessionModel.findOne({ sessionId: sessionid, teacherId: teacherid }, { attendance: 1, groupId: 1, participants: 1 }).populate('groupId').populate('attendance.$.user').lean();
        const externalInvite = sessionInfo && Object(sessionInfo).hasOwnProperty('participants') ? sessionInfo.participants.split(',').length : 0;
        const promArr = sessionInfo.attendance.map((user) => {
            return profile(user);
        });
        const profiles = await Promise.all(promArr);
        sessionInfo.attendance = profiles;
        console.log(profiles);
        const resp = {
            _id: sessionInfo._id,
            invited: externalInvite + sessionInfo.groupId.students.length,
            attendance: sessionInfo.attendance,
            attended: sessionInfo.attendance.length
        }
        return successResponseWithData(res, 'success', resp);
    }
];

async function profile(user) {
    return new Promise(async (resolve, reject) => {
        const temp = { ...user }
        const userInfo = await StudentModel.findOne({ _id: user.user }).lean();
        temp.username = userInfo.username;
        resolve(temp);
    });
}

export default {

    checkAccess,
    grantAccess,
    attendence
};
