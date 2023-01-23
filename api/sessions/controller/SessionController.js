import SessionModel from "../model/SessionModel.js";
import mailer from "../../utils/sendEmail.js";
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

import { body, param, validationResult } from "express-validator";

/**
 * @description User Constants
 * @param SessionConstants
 */
import {
  SessionConstants
} from "../const.js";
import groupsModels from "../../groups/models/groups.models.js";
import StudentModel from "../../user/model/StudentModel.js";
import TeacherModel from "../../user/model/TeacherModel.js";
import mongoose from "mongoose";

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

const sessionsById = async (req, res) => {
  try {
    // console.log(req.params);
    let sessions = await SessionModel.aggregate([
      {
        '$match': {
          '$or': [
            {
              'teacherId': req.params.id
            }, {
              'school_id': req.params.id
            }
          ]
        }
      }, {
        '$addFields': {
          'updatedAt': {
            '$dateToString': {
              'format': '%Y-%m-%d',
              'date': '$createdAt'
            }
          },
          'createdAt': {
            '$dateToString': {
              'format': '%Y-%m-%d',
              'date': '$createdAt'
            }
          }
        }
      }, {
        '$match': {
          '$or': [
            {
              'type': 'ScheduledSession',
              'end': {
                '$gte': new Date().toISOString().split('T')[0]
              }
            }, {
              'type': 'liveSession',
              'createdAt': {
                '$gte': new Date().toISOString().split('T')[0]
              }
            }, {
              'type': 'quickSession',
              'createdAt': {
                '$gte': new Date().toISOString().split('T')[0]
              }
            }
          ]
        }
      }, {
        '$lookup': {
          'from': 'teachers',
          'localField': 'teacherId',
          'foreignField': 'userId',
          'as': 'teacher'
        }
      }, {
        '$unwind': {
          'path': '$teacher',
          'preserveNullAndEmptyArrays': true
        }
      }
    ]).exec();
    return successResponseWithData(
      res,
      SessionConstants.sessionsFetchedSuccessfully,
      sessions
    );
  } catch (e) {
    return validationErrorWithData(res, SessionConstants.errorOccurred, e);
  }
};

const sessionsByStudentId = [
  param("student_id").notEmpty().isString().trim().withMessage('valid student id is required'),
  async (req, res) => {
    try {
      const teachers = await StudentModel.aggregate([
        {
          '$match': {
            '_id': mongoose.Types.ObjectId(req.params.student_id)
          }
        }, {
          '$unwind': {
            'path': '$teachers'
          }
        }, {
          '$addFields': {
            'teacher_id': {
              '$toObjectId': '$teachers._id'
            }
          }
        }, {
          '$lookup': {
            'from': 'teachers',
            'localField': 'teacher_id',
            'foreignField': '_id',
            'as': 'teacher'
          }
        }
      ]);
      const teacherArr = (teachers.map(x => x.teacher[0] || [])).map(x => x.userId || '');
      // const sessions = await SessionModel.find({ teacherId: { $in: teacherArr } }).exec();
      const sessions = await SessionModel.aggregate([
        {
          '$match': {
            'teacherId': { $in: teacherArr }
          }
        }, {
          '$addFields': {
            'updatedAt': {
              '$dateToString': {
                'format': '%Y-%m-%d',
                'date': '$createdAt'
              }
            },
            'createdAt': {
              '$dateToString': {
                'format': '%Y-%m-%d',
                'date': '$createdAt'
              }
            }
          }
        }, {
          '$match': {
            '$or': [
              {
                'type': 'ScheduledSession',
                'end': {
                  '$gte': new Date().toISOString().split('T')[0]
                }
              }, {
                'type': 'liveSession',
                'createdAt': {
                  '$gte': new Date().toISOString().split('T')[0]
                }
              }, {
                'type': 'quickSession',
                'createdAt': {
                  '$gte': new Date().toISOString().split('T')[0]
                }
              }
            ]
          }
        }, {
          '$lookup': {
            'from': 'teachers',
            'localField': 'teacherId',
            'foreignField': 'userId',
            'as': 'teacher'
          }
        }, {
          '$unwind': {
            'path': '$teacher',
            'preserveNullAndEmptyArrays': true
          }
        }
      ]).exec();
      return successResponseWithData(
        res,
        SessionConstants.sessionsFetchedSuccessfully,
        sessions
      );
    } catch (e) {
      return validationErrorWithData(res, SessionConstants.errorOccurred, e);
    }
  }];

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
          teacherId,
          type,
          start,
          end,
          participants,
          school_id,
          scheduledBy
        } = req.body;

        const createData = {
          title,
          description,
        }

        createData.title = title;
        if (groupId)
          createData.groupId = groupId;
        createData.description = description;
        if (teacherId)
          createData.teacherId = teacherId;
        if (participants) {
          createData.participants = participants;
        }
        createData.type = type || "ScheduledSession";
        if (start)
          createData.start = start;
        if (end)
          createData.end = end;

        createData.school_id = school_id;
        createData.scheduledBy = scheduledBy;
        console.log("createData : " + createData);
        try {
          const sessionData = await SessionModel.create(createData);
          if (groupId && type !== 'quickSession') {
            let totalParticipants = (await groupsModels.findOne({ _id: groupId }).populate('students').lean()).students.map(x => x.email);
            if (participants) {
              totalParticipants = totalParticipants.concat(participants.split(","));
            }
            let attendenceUsers = await StudentModel.find({ email: { $in: totalParticipants } }, { email: 1, username: 1 }).lean();
            attendenceUsers = attendenceUsers.map(user => ({ user: user._id, loggedIn: false, writeAccess: false, huddle: "", sessionId: "", username: user.username }));
            await SessionModel.updateOne({ _id: sessionData._id }, {
              $set: {
                attendance: attendenceUsers
              }
            });
            totalParticipants.forEach(ids => {
              const template = '<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>    <meta charset="utf-8"> <meta name="viewport" content="width=device-width">     <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="x-apple-disable-message-reformatting">      <title></title> <link href="https://fonts.googleapis.com/css?family=verdana:300,400,700" rel="stylesheet">    <style> html,body {    margin: 0 auto !important;padding: 0 !important;height: 100% !important;width: 100% !important;background: #f1f1f1;}* {-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;}div[style*="margin: 16px 0"] {margin: 0 !important;}table,td {    mso-table-lspace: 0pt !important;    mso-table-rspace: 0pt !important;}table {    border-spacing: 0 !important;    border-collapse: collapse !important;    table-layout: fixed !important;    margin: 0 auto !important;}img {    -ms-interpolation-mode:bicubic;}a {    text-decoration: none;}*[x-apple-data-detectors],  .unstyle-auto-detected-links *,.aBn {    border-bottom: 0 !important;    cursor: default !important;     color: inherit !important;     text-decoration: none !important;     font-size: inherit !important;     font-family: inherit !important;     font-weight: inherit !important;     line-height: inherit !important; } .a6S {     display: none !important;     opacity: 0.01 !important; } .im {     color: inherit !important; } img.g-img + div {     display: none !important; } @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {     u ~ div .email-container {         min-width: 320px !important;     } } @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {     u ~ div .email-container {         min-width: 375px !important;     } } @media only screen and (min-device-width: 414px) {     u ~ div .email-container {         min-width: 414px !important;     } }     </style>     <style> 	    .primary{ 	background: #30e3ca; } .bg_white{ 	background: #ffffff; } .bg_light{ 	background: #fafafa; } .bg_black{ 	background: #000000; } .bg_dark{ 	background: rgba(0,0,0,.8); } .email-section{ 	padding:2.5em; } .btn{ 	padding: 10px 15px; 	display: inline-block; } .btn.btn-primary{ 	border-radius: 5px; 	background: #30e3ca; 	color: #ffffff; } .btn.btn-white{ 	border-radius: 5px; 	background: #ffffff; 	color: #000000; } .btn.btn-white-outline{ 	border-radius: 5px; 	background: transparent; 	border: 1px solid #fff; 	color: #fff; } .btn.btn-black-outline{ 	border-radius: 0px; 	background: transparent; 	border: 2px solid #000; 	color: #000; 	font-weight: 700; } h1,h2,h3,h4,h5,h6{ 	font-family: "verdana", sans-serif; 	color: #000000; 	margin-top: 0; 	font-weight: 400; } body{ 	font-family: "verdana", sans-serif; 	font-weight: 400; 	font-size: 15px; 	line-height: 1.8; 	color: rgba(0,0,0,.4); } a{ 	color: #30e3ca; } table{ } .logo h1{ 	margin: 0; } .logo h1 a{ 	color: #30e3ca; 	font-size: 24px; 	font-weight: 700; 	font-family: "verdana", sans-serif; } .hero{ 	position: relative; 	z-index: 0; } .hero .text{ 	color: rgba(0,0,0,.3); } .hero .text h2{ 	color: #000; 	font-size: 40px; 	margin-bottom: 0; 	font-weight: 400; 	line-height: 1.4; } .hero .text h3{ 	font-size: 24px; 	font-weight: 300; } .hero .text h2 span{ 	font-weight: 600; 	color: #30e3ca; } .heading-section{ } .heading-section h2{ 	color: #000000; 	font-size: 28px; 	margin-top: 0; 	line-height: 1.4; 	font-weight: 400; } .heading-section .subheading{ 	margin-bottom: 20px !important; 	display: inline-block; 	font-size: 13px; 	text-transform: uppercase; 	letter-spacing: 2px; 	color: rgba(0,0,0,.4); 	position: relative; } .heading-section .subheading::after{ 	position: absolute; 	left: 0; 	right: 0; 	bottom: -10px; 	width: 100%; 	height: 2px; 	background: #30e3ca; 	margin: 0 auto; } .heading-section-white{ 	color: rgba(255,255,255,.8); } .heading-section-white h2{ 	font-family: 	line-height: 1; 	padding-bottom: 0; } .heading-section-white h2{ 	color: #ffffff; } .heading-section-white .subheading{ 	margin-bottom: 0; 	display: inline-block; 	font-size: 13px; 	text-transform: uppercase; 	letter-spacing: 2px; 	color: rgba(255,255,255,.4); } ul.social{ 	padding: 0; } ul.social li{ 	display: inline-block; 	margin-right: 10px; } .footer{ 	border-top: 1px solid rgba(0,0,0,.05); 	color: rgba(0,0,0,.5); } .footer .heading{ 	color: #000; 	font-size: 20px; } .footer ul{ 	margin: 0; 	padding: 0; } .footer ul li{ 	list-style: none; 	margin-bottom: 10px; } .footer ul li a{ 	color: rgba(0,0,0,1); } @media screen and (max-width: 500px) { }     </style> </head> <body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f1f1f1;"> 	<center style="width: 100%; background-color: #f1f1f1;">     <div style="display: none; font-size: 1px;max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">       &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;     </div>     <div style="max-width: 600px; margin: 0 auto;" class="email-container">       <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto;">       	<tr>           <td valign="top" class="bg_white" style="padding: 1em 2.5em 0 2.5em;">           	<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">           	</table>           </td> 	      </tr> 	      <tr>           <td valign="middle" class="hero bg_white" style="padding: 3em 0 2em 0;">             <img src="https://class.thestreamboard.com/boards/tools/svg/logo-final.png" alt="" style="width: 300px; height: auto; margin: auto; display: block;">           </td> 	      </tr> 				<tr>           <td valign="middle" class="hero bg_white">             <table>             	<tr>             		<td>             			<div class="text" style="padding: 0 2.5em; text-align: center;"> 						<h3>Hi ' + ids + ',</h3>             				<h3>' + title + '  </h3>             				<h4>' + description + '</h4>             				<p><a href="https://class.thestreamboard.com/?code=' + sessionData.sessionId + '" class="btn btn-primary">Join</a></p>             			</div>             		</td>             	</tr>             </table>           </td> 	      </tr>       </table>     </div>   </center> </body> </html>';
              mailer(ids, template);
            });
          }
          console.log("sessionData : " + sessionData);
          let sessionResponse = {};
          sessionResponse = {
            tokenId: sessionData.sessionId,
            sessionLink: "https://class.thestreamboard.com/?code=" + sessionData.sessionId,
          }
          await SessionModel.updateOne({ sessionId: sessionData.sessionId }, { sessionLink: "https://class.thestreamboard.com/?code=" + sessionData.sessionId }).lean();
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
            return ErrorResponseWithData(res, str + " already taken", {}, 400);
          }
        }

      }
    } catch (err) {
      return ErrorResponse(res, err);
    }
  },
];
const updateSession = [
  param('sessionId').isString().trim().notEmpty().withMessage('session id is required'),
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
        const sessionId = req.params.sessionId;
        const {
          title,
          groupId,
          description,
          teacherId,
          type,
          start,
          end,
          participants,
          school_id,
          scheduledBy
        } = req.body;

        const createData = {
          title,
          description,
        }

        createData.title = title;
        if (groupId)
          createData.groupId = groupId;
        createData.description = description;
        if (teacherId)
          createData.teacherId = teacherId;
        if (participants) {
          createData.participants = participants;
        }
        createData.type = type || "ScheduledSession";
        if (start)
          createData.start = start;
        if (end)
          createData.end = end;

        createData.school_id = school_id;
        createData.scheduledBy = scheduledBy;
        console.log("createData : " + createData);
        try {
          const sessionData = await SessionModel.findOneAndUpdate({ _id: sessionId }, createData);
          let sessionResponse = {};
          sessionResponse = {
            tokenId: sessionData.sessionId,
            sessionLink: "https://class.thestreamboard.com/?code=" + sessionData.sessionId,
          }
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
            return ErrorResponseWithData(res, str + " already taken", {}, 400);
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

const sessionListForTeacher = [
  param("teacherId").notEmpty().isString().trim().withMessage('valid teacher id is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation error in session list for teacher");
        return validationErrorWithData(
          res,
          AuthConstants.validationError,
          errors.array()
        );
      } else {
        const { teacherId } = req.params;
        const resp = await SessionModel.aggregate([
          {
            '$facet': {
              'ScheduledSession': [
                {
                  '$addFields': {
                    'updatedAt': {
                      '$dateToString': {
                        'format': '%Y-%m-%d',
                        'date': '$createdAt'
                      }
                    },
                    'createdAt': {
                      '$dateToString': {
                        'format': '%Y-%m-%d',
                        'date': '$createdAt'
                      }
                    }
                  }
                },
                {
                  '$match': {
                    'type': 'ScheduledSession',
                    'teacherId': teacherId,
                    'end': {
                      '$gte': new Date().toISOString().split('T')[0]
                    }
                  }
                }
              ],
              'liveSession': [
                {
                  '$addFields': {
                    'updatedAt': {
                      '$dateToString': {
                        'format': '%Y-%m-%d',
                        'date': '$createdAt'
                      }
                    },
                    'createdAt': {
                      '$dateToString': {
                        'format': '%Y-%m-%d',
                        'date': '$createdAt'
                      }
                    }
                  }
                },
                {
                  '$match': {
                    'type': 'liveSession',
                    'teacherId': teacherId,
                    'createdAt': {
                      '$gte': new Date().toISOString().split('T')[0]
                    }
                  }
                }
              ],
              'quickSession': [
                {
                  '$addFields': {
                    'updatedAt': {
                      '$dateToString': {
                        'format': '%Y-%m-%d',
                        'date': '$createdAt'
                      }
                    },
                    'createdAt': {
                      '$dateToString': {
                        'format': '%Y-%m-%d',
                        'date': '$createdAt'
                      }
                    }
                  }
                },
                {
                  '$match': {
                    'type': 'quickSession',
                    'teacherId': teacherId,
                    'createdAt': {
                      '$gte': new Date().toISOString().split('T')[0]
                    }
                  }
                }
              ]
            }
          }
        ]);
        return successResponseWithData(res, 'Success', resp);
      }
    } catch (error) {
      return ErrorResponseWithData(res, error.message, {}, 400);
    }
  }];

const sessionListForStudent = [
  param("studentId").notEmpty().isString().trim().withMessage('valid student id is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation error in session list for student");
        return validationErrorWithData(
          res,
          AuthConstants.validationError,
          errors.array()
        );
      } else {
        const { studentId } = req.params;
        const studentProf = await StudentModel.findOne({ userId: studentId }).lean();
        const resp = await SessionModel.aggregate([
          {
            '$facet': {
              'ScheduledSession': [
                {
                  '$addFields': {
                    'updatedAt': {
                      '$dateToString': {
                        'format': '%Y-%m-%d',
                        'date': '$createdAt'
                      }
                    },
                    'createdAt': {
                      '$dateToString': {
                        'format': '%Y-%m-%d',
                        'date': '$createdAt'
                      }
                    }
                  }
                },
                {
                  '$match': {
                    'type': 'ScheduledSession',
                    'attendance.user': mongoose.Types.ObjectId(studentProf._id),
                    'end': {
                      '$gte': new Date().toISOString().split('T')[0]
                    }
                  }
                }
              ],
              'liveSession': [
                {
                  '$addFields': {
                    'updatedAt': {
                      '$dateToString': {
                        'format': '%Y-%m-%d',
                        'date': '$createdAt'
                      }
                    },
                    'createdAt': {
                      '$dateToString': {
                        'format': '%Y-%m-%d',
                        'date': '$createdAt'
                      }
                    }
                  }
                },
                {
                  '$match': {
                    'type': 'liveSession',
                    'attendance.user': mongoose.Types.ObjectId(studentProf._id),
                    'createdAt': {
                      '$gte': new Date().toISOString().split('T')[0]
                    }
                  }
                }
              ],
              'quickSession': [
                {
                  '$addFields': {
                    'updatedAt': {
                      '$dateToString': {
                        'format': '%Y-%m-%d',
                        'date': '$createdAt'
                      }
                    },
                    'createdAt': {
                      '$dateToString': {
                        'format': '%Y-%m-%d',
                        'date': '$createdAt'
                      }
                    }
                  }
                },
                {
                  '$match': {
                    'type': 'quickSession',
                    'attendance.user': mongoose.Types.ObjectId(studentProf._id),
                    'createdAt': {
                      '$gte': new Date().toISOString().split('T')[0]
                    }
                  }
                }
              ]
            }
          }
        ]);
        return successResponseWithData(res, 'Success', resp);
      }
    } catch (error) {
      return ErrorResponseWithData(res, error.message, {}, 400);
    }
  }];
const createAdhocSession = [
  body("sessionId")
    .isString()
    .trim()
    .notEmpty()
    .withMessage(SessionConstants.sessionId),
  body("teacherId")
    .isString()
    .trim()
    .notEmpty()
    .withMessage(SessionConstants.validTeacherIDMSg),
  body("school_id")
    .isString()
    .trim()
    .notEmpty()
    .withMessage(SessionConstants.schoolId),
  body("type")
    .isString()
    .trim()
    .notEmpty()
    .withMessage(SessionConstants.sessionType),
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
          sessionId,
          teacherId,
          school_id,
          type
        } = req.body;

        const createData = {
          title: `Adhoc-QS-${Date.now()}`,
          description: `Adhoc quick session`,
        }

        if (teacherId)
          createData.teacherId = teacherId;

        if (school_id)
          createData.school_id = school_id;

        if (sessionId) {
          createData.sessionId = sessionId;
        }

        createData.type = type || "quickSession";
        createData.scheduledBy = 'teacher';
        createData.creationType = 'adhoc'
        console.log("createData : " + createData);
        try {
          const sessionData = await SessionModel.create(createData);
          // if (groupId && type !== 'quickSession') {
          //   let totalParticipants = (await groupsModels.findOne({ _id: groupId }).populate('students').lean()).students.map(x => x.email);
          //   if (participants) {
          //     totalParticipants = totalParticipants.concat(participants.split(","));
          //   }
          //   totalParticipants.forEach(ids => {
          //     const template = '<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>    <meta charset="utf-8"> <meta name="viewport" content="width=device-width">     <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="x-apple-disable-message-reformatting">      <title></title> <link href="https://fonts.googleapis.com/css?family=verdana:300,400,700" rel="stylesheet">    <style> html,body {    margin: 0 auto !important;padding: 0 !important;height: 100% !important;width: 100% !important;background: #f1f1f1;}* {-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;}div[style*="margin: 16px 0"] {margin: 0 !important;}table,td {    mso-table-lspace: 0pt !important;    mso-table-rspace: 0pt !important;}table {    border-spacing: 0 !important;    border-collapse: collapse !important;    table-layout: fixed !important;    margin: 0 auto !important;}img {    -ms-interpolation-mode:bicubic;}a {    text-decoration: none;}*[x-apple-data-detectors],  .unstyle-auto-detected-links *,.aBn {    border-bottom: 0 !important;    cursor: default !important;     color: inherit !important;     text-decoration: none !important;     font-size: inherit !important;     font-family: inherit !important;     font-weight: inherit !important;     line-height: inherit !important; } .a6S {     display: none !important;     opacity: 0.01 !important; } .im {     color: inherit !important; } img.g-img + div {     display: none !important; } @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {     u ~ div .email-container {         min-width: 320px !important;     } } @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {     u ~ div .email-container {         min-width: 375px !important;     } } @media only screen and (min-device-width: 414px) {     u ~ div .email-container {         min-width: 414px !important;     } }     </style>     <style> 	    .primary{ 	background: #30e3ca; } .bg_white{ 	background: #ffffff; } .bg_light{ 	background: #fafafa; } .bg_black{ 	background: #000000; } .bg_dark{ 	background: rgba(0,0,0,.8); } .email-section{ 	padding:2.5em; } .btn{ 	padding: 10px 15px; 	display: inline-block; } .btn.btn-primary{ 	border-radius: 5px; 	background: #30e3ca; 	color: #ffffff; } .btn.btn-white{ 	border-radius: 5px; 	background: #ffffff; 	color: #000000; } .btn.btn-white-outline{ 	border-radius: 5px; 	background: transparent; 	border: 1px solid #fff; 	color: #fff; } .btn.btn-black-outline{ 	border-radius: 0px; 	background: transparent; 	border: 2px solid #000; 	color: #000; 	font-weight: 700; } h1,h2,h3,h4,h5,h6{ 	font-family: "verdana", sans-serif; 	color: #000000; 	margin-top: 0; 	font-weight: 400; } body{ 	font-family: "verdana", sans-serif; 	font-weight: 400; 	font-size: 15px; 	line-height: 1.8; 	color: rgba(0,0,0,.4); } a{ 	color: #30e3ca; } table{ } .logo h1{ 	margin: 0; } .logo h1 a{ 	color: #30e3ca; 	font-size: 24px; 	font-weight: 700; 	font-family: "verdana", sans-serif; } .hero{ 	position: relative; 	z-index: 0; } .hero .text{ 	color: rgba(0,0,0,.3); } .hero .text h2{ 	color: #000; 	font-size: 40px; 	margin-bottom: 0; 	font-weight: 400; 	line-height: 1.4; } .hero .text h3{ 	font-size: 24px; 	font-weight: 300; } .hero .text h2 span{ 	font-weight: 600; 	color: #30e3ca; } .heading-section{ } .heading-section h2{ 	color: #000000; 	font-size: 28px; 	margin-top: 0; 	line-height: 1.4; 	font-weight: 400; } .heading-section .subheading{ 	margin-bottom: 20px !important; 	display: inline-block; 	font-size: 13px; 	text-transform: uppercase; 	letter-spacing: 2px; 	color: rgba(0,0,0,.4); 	position: relative; } .heading-section .subheading::after{ 	position: absolute; 	left: 0; 	right: 0; 	bottom: -10px; 	width: 100%; 	height: 2px; 	background: #30e3ca; 	margin: 0 auto; } .heading-section-white{ 	color: rgba(255,255,255,.8); } .heading-section-white h2{ 	font-family: 	line-height: 1; 	padding-bottom: 0; } .heading-section-white h2{ 	color: #ffffff; } .heading-section-white .subheading{ 	margin-bottom: 0; 	display: inline-block; 	font-size: 13px; 	text-transform: uppercase; 	letter-spacing: 2px; 	color: rgba(255,255,255,.4); } ul.social{ 	padding: 0; } ul.social li{ 	display: inline-block; 	margin-right: 10px; } .footer{ 	border-top: 1px solid rgba(0,0,0,.05); 	color: rgba(0,0,0,.5); } .footer .heading{ 	color: #000; 	font-size: 20px; } .footer ul{ 	margin: 0; 	padding: 0; } .footer ul li{ 	list-style: none; 	margin-bottom: 10px; } .footer ul li a{ 	color: rgba(0,0,0,1); } @media screen and (max-width: 500px) { }     </style> </head> <body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f1f1f1;"> 	<center style="width: 100%; background-color: #f1f1f1;">     <div style="display: none; font-size: 1px;max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">       &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;     </div>     <div style="max-width: 600px; margin: 0 auto;" class="email-container">       <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto;">       	<tr>           <td valign="top" class="bg_white" style="padding: 1em 2.5em 0 2.5em;">           	<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">           	</table>           </td> 	      </tr> 	      <tr>           <td valign="middle" class="hero bg_white" style="padding: 3em 0 2em 0;">             <img src="https://class.thestreamboard.com/boards/tools/svg/logo-final.png" alt="" style="width: 300px; height: auto; margin: auto; display: block;">           </td> 	      </tr> 				<tr>           <td valign="middle" class="hero bg_white">             <table>             	<tr>             		<td>             			<div class="text" style="padding: 0 2.5em; text-align: center;"> 						<h3>Hi ' + ids + ',</h3>             				<h3>' + title + '  </h3>             				<h4>' + description + '</h4>             				<p><a href="https://class.thestreamboard.com/?code=' + sessionData.sessionId + '" class="btn btn-primary">Join</a></p>             			</div>             		</td>             	</tr>             </table>           </td> 	      </tr>       </table>     </div>   </center> </body> </html>';
          //     mailer(ids, template);
          //   });
          // }
          console.log("sessionData : " + sessionData);
          let sessionResponse = {};
          sessionResponse = {
            tokenId: sessionData.sessionId,
            sessionLink: "https://class.thestreamboard.com/?code=" + sessionData.sessionId,
          }
          await SessionModel.updateOne({ sessionId: sessionData.sessionId }, { sessionLink: "https://class.thestreamboard.com/?code=" + sessionData.sessionId }).lean();
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
            return ErrorResponseWithData(res, str + " already taken", {}, 400);
          }
          return ErrorResponseWithData(res, err.message, {}, 500)
        }

      }
    } catch (err) {
      return ErrorResponse(res, err);
    }
  },
];

const addUsersToAdhocSession = [
  body("user")
    .isString()
    .trim()
    .notEmpty()
    .withMessage(SessionConstants.user),
  body("sessionId")
    .isString()
    .trim()
    .notEmpty()
    .withMessage(SessionConstants.sessionId),
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
        const {
          sessionId,
          user
        } = req.body;
        const userProfile = await StudentModel.findOne({ _id: user }).lean();
        const sessionInfo = await SessionModel.findOne({ sessionId });
        const attendence = sessionInfo.attendance || [];
        const exists = attendence.find(user => user.user.toString() === userProfile._id.toString());
        if (!exists) {
          attendence.push({
            user: userProfile._id, writeAccess: false, huddle: "", sessionId: "", loggedIn: true, "username": userProfile.username
          });
        }
        const resp = await SessionModel.updateOne({ sessionId }, { attendance: attendence });
        return successResponseWithData(res, 'success', { "grantAccess": true });
      }
    } catch (error) {
      return ErrorResponseWithData(
        res,
        error.message,
        {},
        400
      );
    }
  }
];

export default {
  allsessions,
  deleteSession,
  createSession,
  updateSession,
  sessionsById,
  sessionsByStudentId,
  sessionListForTeacher,
  sessionListForStudent,
  createAdhocSession,
  addUsersToAdhocSession
};
