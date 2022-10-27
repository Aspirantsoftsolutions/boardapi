import validator from "express-validator";

const { body, validationResult } = validator;

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

import utility from "../../utils/utility.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mailer from "../../utils/sendEmail.js";
import AWS_SNS from "../../utils/aws-sns-sms.js";

/**
 * @description Auth Constants
 * @param AuthConstants
 */
import { AuthConstants } from "../const.js";

import RefreshToken from "../model/refreshTokensModel.js";

import crypto from "crypto";

import UserModel from "../../user/model/UserModel.js";
import TeacherModel from "../../user/model/TeacherModel.js";
import StudentModel from "../../user/model/StudentModel.js";
import MasterModel from "../../user/model/MasterModel.js";
import loginSessionsModel from "../model/loginSessionsModel.js";
import ClassModel from "../../user/model/ClassModel.js";
import GradesModel from "../../grades/models/grades.models.js";
import InviteModel from "../../user/model/InviteModel.js";
import ActivityModel from "../model/activityModel.js";

/**
 * User login.
 *
 * @param {string}      identity
 * @param {string}      password
 *
 * @returns {Object}
 */
const login = [
  // Validate and Sanitize fields.
  body("identity")
    .isString()
    .trim()
    .escape()
    .withMessage(AuthConstants.loginIdentityRequired),

  // Process request after validation and sanitization.
  async (req, res) => {
    try {
      // Extract the validation errors from a request.
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Display sanitized values/errors messages.
        return validationErrorWithData(
          res,
          AuthConstants.validationError,
          errors.array()
        );
      } else {
        const { identity, password } = req.body;

        // Regular expression to check if identity is email or not
        const re =
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const isEmail = re.test(String(identity).toLowerCase());
        let userData = {};

        if (isEmail) {
          let masterData = await MasterModel.findOne({
            email: identity,
          });
          if (!masterData) {
            return notFoundResponse(res, AuthConstants.userNotFound);
          }
          if (masterData.role == "Teacher") {
            let users = await TeacherModel.aggregate([
              {
                $match: {
                  email: identity,
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "classId",
                  foreignField: "userId",
                  as: "class",
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "schoolId",
                  foreignField: "userId",
                  as: "school",
                },
              },
            ]);
            userData = users[0];
            console.log("Teacher data : " + userData.school);
          } else if (masterData.role == "Student") {
            userData = await StudentModel.aggregate([
              {
                $match: {
                  email: identity,
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "classId",
                  foreignField: "userId",
                  as: "class",
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "schoolId",
                  foreignField: "userId",
                  as: "school",
                },
              },
            ]);
            userData = userData[0];
            console.log(userData);
          } else {
            let users = await UserModel.aggregate([
              {
                $match: {
                  email: identity,
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "classId",
                  foreignField: "userId",
                  as: "class",
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "schoolId",
                  foreignField: "userId",
                  as: "school",
                },
              },
            ]);
            userData = users[0];
          }

          console.log("user has provided email : " + identity);
        } else {
          console.log("user has provided mobile : " + identity);
          userData = await UserModel.findOne({
            $or: [{ username: identity }, { mobile: identity }],
          });
        }

        if (!userData) {
          // Not Found (404) If user is not found in the DB
          console.log("User : " + identity + " is not found");
          return notFoundResponse(res, AuthConstants.userNotFound);
        }

        if (userData.status === 'pending' || userData.status === 'inactive') {
          console.log("user registration status is " + userData.status);
          return ErrorResponseWithData(res, `user registration is ${userData.status}`);
        }

        const isPassValid = await bcrypt.compare(password, userData.password);

        if (!isPassValid) {
          // Bad Request (400) as password is incorrect
          console.log("Wrong password provided for : " + identity);
          return ErrorResponseWithData(res, AuthConstants.wrongPassword);
        }

        if (!userData.isConfirmed) {
          console.log("User account is not verified");
          // Unauthorized (401) as account is not confirmed. User cannot login.
          // Otp will be sent to user

          // Generate OTP
          console.log("Generating OTP");
          const otp = utility.randomNumber(6);

          let identityInDB = {};
          let identityInDBValue = {};

          // If user registered with mobile number then send OTP to it
          if (userData.mobile != undefined) {
            identityInDB = "mobile";
            identityInDBValue = userData.mobile;
            const message = `<#> ${otp} ` + AuthConstants.otpMessage;
            // await AWS_SNS.sendSMS(message, userData.countryCode + userData.mobile);
            console.log(
              "Sent OTP to " + identityInDB + " : " + identityInDBValue
            );
          }

          // If user registered with email then send OTP to it
          if (userData.email != undefined) {
            identityInDB = "email";
            identityInDBValue = userData.email;
            mailer(identityInDBValue, otp);
            console.log(
              "Sent OTP to " + identityInDB + " : " + identityInDBValue
            );
          }

          console.log("Updating user document in DB with new OTP");
          // Update OTP to the user document
          // await UserModel.findOneAndUpdate(
          //     {
          //       identityInDB : identityInDBValue,
          //     },
          //     {
          //       $set : { confirmOTP: otp }
          //     }
          // );

          console.log("Returning response to user as account is not verified");
          // Account is not verified. Sending the message to user
          return unauthorizedResponse(res, AuthConstants.accountNotVerified);
        }

        console.log("Forming JWT Payload");
        const jwtPayload = {
          _id: userData._id,
          mobile: userData.mobile,
        };

        console.log("Setting expirt time to JWT");
        const jwtData = {
          expiresIn: process.env.JWT_TIMEOUT_DURATION,
        };

        const secret = process.env.JWT_SECRET;

        console.log("Generating JWT");
        jwtPayload.token = jwt.sign(jwtPayload, secret, jwtData);
        jwtPayload.refreshToken = crypto.randomBytes(40).toString("hex");
        jwtPayload.isActive = userData.isActive;
        jwtPayload.user = userData;

        const refreshToken = new RefreshToken({
          user: userData._id,
          token: jwtPayload.refreshToken,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdByIp: req.headers.IPV_Address,
        });
        console.log("Saving Refresh token in DB");
        refreshToken.save();

        console.log("returning successful response to user");
        if (userData.isActive) {
          const activity = await ActivityModel.create({ user: userData._id, activityType: 'login', info: { type: 'web', role: userData.role } });
          console.log("AuthController:: Login:: activity:: login");
          return successResponseWithData(
            res,
            AuthConstants.loginSuccessMsg,
            jwtPayload
          );
        } else {
          return ErrorResponseWithData(res, AuthConstants.loginErrorMsg);
        }
      }
    } catch (err) {
      //throw error in json response with status 500.
      console.log("Error occurred in login : " + err);
      return ErrorResponse(res, err);
    }
  },
];

const qrlogin = [
  body("device")
    .notEmpty()
    .isString()
    .trim()
    .escape()
    .withMessage(AuthConstants.deviceIdentity),
  // Validate and Sanitize fields.
  body("identity")
    .if(body('device').equals('mobile'))
    .notEmpty()
    .isString()
    .trim()
    .escape()
    .withMessage(AuthConstants.loginIdentityRequired),
  body("qrCode").notEmpty().isString()
    .trim()
    .escape()
    .withMessage(AuthConstants.qrInfo),
  // body("qrCode").if(body("device").equals('mobile')).notEmpty().isString()
  // .trim()
  // .escape()
  // .withMessage(AuthConstants.qrInfo),

  // Process request after validation and sanitization.
  async (req, res) => {
    try {
      // Extract the validation errors from a request.
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Display sanitized values/errors messages.
        return validationErrorWithData(
          res,
          AuthConstants.validationError,
          errors.array()
        );
      } else {
        const { identity, device, qrCode } = req.body;

        // Regular expression to check if identity is email or not
        const re =
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const isEmail = re.test(String(identity).toLowerCase());
        let userData = {};
        if (isEmail) {
          userData = await getIdentity(identity)
        } else if (qrCode) {
          const sessionEmail = await loginSessionsModel.findOne({ qrInfo: qrCode });
          userData = await getIdentity(sessionEmail.user)
        }

        if (device === 'mobile') {
          const query = { qrInfo: qrCode, status: 'true', user: identity };
          const sessionInfo = await loginSessionsModel.findOne(query);
          if (!sessionInfo) {
            const resp = await loginSessionsModel.update({ qrInfo: qrCode, user: identity }, { qrInfo: qrCode, loginType: 'mobile', user: identity, status: 'true' }, { upsert: true });
            return successResponseWithData(res, 'session created', query);
          } else {
            return successResponseWithData(res, 'session exist', sessionInfo);
          }
        } else if (device === 'web') {
          const query = { qrInfo: qrCode, status: 'true' };
          const sessionInfo = await loginSessionsModel.findOne(query);
          if (sessionInfo) {

            // userData.qrCode = sessionInfo.qrInfo;
            if (!userData) {
              // Not Found (404) If user is not found in the DB
              console.log("User : " + identity + " is not found");
              return notFoundResponse(res, AuthConstants.userNotFound);
            }

            if (!userData.isConfirmed) {
              console.log("User account is not verified");
              // Unauthorized (401) as account is not confirmed. User cannot login.
              // Otp will be sent to user

              // Generate OTP
              console.log("Generating OTP");
              const otp = utility.randomNumber(6);

              let identityInDB = {};
              let identityInDBValue = {};

              // If user registered with mobile number then send OTP to it
              if (userData.mobile != undefined) {
                identityInDB = "mobile";
                identityInDBValue = userData.mobile;
                const message = `<#> ${otp} ` + AuthConstants.otpMessage;
                // await AWS_SNS.sendSMS(message, userData.countryCode + userData.mobile);
                console.log(
                  "Sent OTP to " + identityInDB + " : " + identityInDBValue
                );
              }

              // If user registered with email then send OTP to it
              if (userData.email != undefined) {
                identityInDB = "email";
                identityInDBValue = userData.email;
                mailer(identityInDBValue, otp);
                console.log(
                  "Sent OTP to " + identityInDB + " : " + identityInDBValue
                );
              }

              console.log("Updating user document in DB with new OTP");
              // Update OTP to the user document
              // await UserModel.findOneAndUpdate(
              //     {
              //       identityInDB : identityInDBValue,
              //     },
              //     {
              //       $set : { confirmOTP: otp }
              //     }
              // );

              console.log("Returning response to user as account is not verified");
              // Account is not verified. Sending the message to user
              return unauthorizedResponse(res, AuthConstants.accountNotVerified);
            }

            console.log("Forming JWT Payload");
            const jwtPayload = {
              _id: userData._id,
              mobile: userData.mobile,
            };

            console.log("Setting expirt time to JWT");
            const jwtData = {
              expiresIn: process.env.JWT_TIMEOUT_DURATION,
            };

            const secret = process.env.JWT_SECRET;

            console.log("Generating JWT");
            jwtPayload.token = jwt.sign(jwtPayload, secret, jwtData);
            jwtPayload.refreshToken = crypto.randomBytes(40).toString("hex");
            jwtPayload.isActive = userData.isActive;
            jwtPayload.user = userData;

            const refreshToken = new RefreshToken({
              user: userData._id,
              token: jwtPayload.refreshToken,
              expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              createdByIp: req.headers.IPV_Address,
            });
            console.log("Saving Refresh token in DB");
            refreshToken.save();

            console.log("returning successful response to user");
            if (userData.isActive) {
              const activity = await ActivityModel.create({ user: userData._id, activityType: 'login', info: { type: 'qrlogin', device, role: userData.role } });
              console.log("AuthController:: qrlogin:: activity:: qrlogin");
              return successResponseWithData(
                res,
                AuthConstants.loginSuccessMsg,
                { ...jwtPayload, qrCode: sessionInfo.qrInfo }
              );
            } else {
              return ErrorResponseWithData(res, AuthConstants.loginErrorMsg);
            }
          } else if (!sessionInfo) {
            return ErrorResponseWithData(res, 'session not exist', {});
          }
        }

      }
    } catch (err) {
      //throw error in json response with status 500.
      console.log("Error occurred in login : " + err.message || err);
      return ErrorResponse(res, err);
    }
  },
];

const socialLogin = [
  body("identity")
    .isString()
    .trim()
    .escape()
    .withMessage(AuthConstants.loginIdentityRequired),

  // Process request after validation and sanitization.
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
        const { identity } = req.body;

        // Regular expression to check if identity is email or not
        const re =
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const isEmail = re.test(String(identity).toLowerCase());
        let userData = {};

        if (isEmail) {
          let masterData = await MasterModel.findOne({
            email: identity,
          });
          if (!masterData) {
            return notFoundResponse(res, AuthConstants.userNotFound);
          }
          if (masterData.role == "Teacher") {
            let users = await TeacherModel.aggregate([
              {
                $match: {
                  email: identity,
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "classId",
                  foreignField: "userId",
                  as: "class",
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "schoolId",
                  foreignField: "userId",
                  as: "school",
                },
              },
            ]);
            userData = users[0];
            console.log("Teacher data : " + userData.school);
          } else if (masterData.role == "Student") {
            userData = await StudentModel.aggregate([
              {
                $match: {
                  email: identity,
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "classId",
                  foreignField: "userId",
                  as: "class",
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "schoolId",
                  foreignField: "userId",
                  as: "school",
                },
              },
            ]);
            userData = userData[0];
            console.log(userData);
          } else {
            let users = await UserModel.aggregate([
              {
                $match: {
                  email: identity,
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "classId",
                  foreignField: "userId",
                  as: "class",
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "schoolId",
                  foreignField: "userId",
                  as: "school",
                },
              },
            ]);
            userData = users[0];
          }

          console.log("user has provided email : " + identity);
        } else {
          console.log("user has provided mobile : " + identity);
          userData = await UserModel.findOne({
            $or: [{ username: identity }, { mobile: identity }],
          });
        }

        if (!userData) {
          // Not Found (404) If user is not found in the DB
          console.log("User : " + identity + " is not found");
          return notFoundResponse(res, AuthConstants.userNotFound);
        }

        if (!userData.isConfirmed) {
          console.log("User account is not verified");
          // Unauthorized (401) as account is not confirmed. User cannot login.
          // Otp will be sent to user

          // Generate OTP
          console.log("Generating OTP");
          const otp = utility.randomNumber(6);

          let identityInDB = {};
          let identityInDBValue = {};

          // If user registered with mobile number then send OTP to it
          if (userData.mobile != undefined) {
            identityInDB = "mobile";
            identityInDBValue = userData.mobile;
            const message = `<#> ${otp} ` + AuthConstants.otpMessage;
            // await AWS_SNS.sendSMS(message, userData.countryCode + userData.mobile);
            console.log(
              "Sent OTP to " + identityInDB + " : " + identityInDBValue
            );
          }

          // If user registered with email then send OTP to it
          if (userData.email != undefined) {
            identityInDB = "email";
            identityInDBValue = userData.email;
            mailer(identityInDBValue, otp);
            console.log(
              "Sent OTP to " + identityInDB + " : " + identityInDBValue
            );
          }

          console.log("Updating user document in DB with new OTP");
          // Update OTP to the user document
          // await UserModel.findOneAndUpdate(
          //     {
          //       identityInDB : identityInDBValue,
          //     },
          //     {
          //       $set : { confirmOTP: otp }
          //     }
          // );

          console.log("Returning response to user as account is not verified");
          // Account is not verified. Sending the message to user
          return unauthorizedResponse(res, AuthConstants.accountNotVerified);
        }

        console.log("Forming JWT Payload");
        const jwtPayload = {
          _id: userData._id,
          mobile: userData.mobile,
        };

        console.log("Setting expirt time to JWT");
        const jwtData = {
          expiresIn: process.env.JWT_TIMEOUT_DURATION,
        };

        const secret = process.env.JWT_SECRET;

        console.log("Generating JWT");
        jwtPayload.token = jwt.sign(jwtPayload, secret, jwtData);
        jwtPayload.refreshToken = crypto.randomBytes(40).toString("hex");
        jwtPayload.isActive = userData.isActive;
        jwtPayload.user = userData;

        const refreshToken = new RefreshToken({
          user: userData._id,
          token: jwtPayload.refreshToken,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdByIp: req.headers.IPV_Address,
        });
        console.log("Saving Refresh token in DB");
        refreshToken.save();

        console.log("returning successful response to user");
        if (userData.isActive) {
          const activity = await ActivityModel.create({ user: userData._id, activityType: 'socialLogin', info: { role: userData.role } });
          console.log("AuthController:: socialLogin:: activity:: socialLogin");
          return successResponseWithData(
            res,
            AuthConstants.loginSuccessMsg,
            jwtPayload
          );
        } else {
          return ErrorResponseWithData(res, AuthConstants.loginErrorMsg);
        }
      }
    } catch (error) {
      console.log("Error occurred in login : " + err);
      return ErrorResponse(res, err);
    }
  }
]


async function getIdentity(identity) {
  let userData = {};
  let masterData = await MasterModel.findOne({
    email: identity,
  });

  if (!masterData) {
    return notFoundResponse(res, AuthConstants.userNotFound);
  }
  if (masterData.role == "Teacher") {
    let users = await TeacherModel.aggregate([
      {
        $match: {
          email: identity,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "classId",
          foreignField: "userId",
          as: "class",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "schoolId",
          foreignField: "userId",
          as: "school",
        },
      },
    ]);
    userData = users[0];
    console.log("Teacher data : " + userData.school);
  } else if (masterData.role == "Student") {
    userData = await StudentModel.aggregate([
      {
        $match: {
          email: identity,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "classId",
          foreignField: "userId",
          as: "class",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "schoolId",
          foreignField: "userId",
          as: "school",
        },
      },
    ]);
    userData = userData[0];
    console.log(userData);
  } else {
    let users = await UserModel.aggregate([
      {
        $match: {
          email: identity,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "classId",
          foreignField: "userId",
          as: "class",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "schoolId",
          foreignField: "userId",
          as: "school",
        },
      },
    ]);
    userData = users[0];
  }

  console.log("user has provided email : " + identity);
  return userData;
}

const qrlogout = [
  body("identity")
    .notEmpty()
    .isString()
    .trim()
    .escape()
    .withMessage(AuthConstants.loginIdentityRequired),
  body("qrCode")
    .notEmpty()
    .isString()
    .trim()
    .escape()
    .withMessage(AuthConstants.qrInfo),
  async (req, res) => {
    try {
      const { identity, qrCode } = req.body;
      const query = { user: identity, qrInfo: qrCode };
      const updateResp = await loginSessionsModel.findOneAndUpdate(query, { status: false });
      if (updateResp) {
        return successResponseWithData(res, 'logged out successfully', {});
      } else if (!updateResp) {
        return ErrorResponseWithData(res, 'session not found', 400);
      }
    } catch (error) {
      return ErrorResponseWithData(res, 'internal server error', error, 500);
    }
  }
]

const qrSessionStatus = [body("identity")
  .notEmpty()
  .isString()
  .trim()
  .escape()
  .withMessage(AuthConstants.loginIdentityRequired),
body("qrCode")
  .notEmpty()
  .isString()
  .trim()
  .escape()
  .withMessage(AuthConstants.qrInfo), async (req, res) => {
    try {
      const { identity, qrCode } = req.body;
      const query = { user: identity, qrInfo: qrCode };
      const rec = await loginSessionsModel.findOne(query).lean();
      if (rec) {
        return successResponseWithData(res, 'success', rec);
      }
      return ErrorResponseWithData(res, 'session not found', 400);
    } catch (error) {
      return ErrorResponseWithData(res, 'internal server error', error, 500);
    }
  }];

const UniversalRegister = [
  async (req, res) => {
    try {
      const { role } = req.body;
      if (role && role == "Teacher") {
        registerTeacher();
      } else if (role && role == "Student") {
        registerStudent();
      } else {
        register();
      }
    } catch (err) {
      return ErrorResponse(res, err);
    }
  },
];

/**
 * User registration.
 *
 * @param {string}      user_name
 * @param {string}      mobile
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
const register = [
  body("username")
    .isString()
    .trim()
    .withMessage(AuthConstants.usernameRequired)
    .escape(),
  body("password")
    .isString()
    .trim()
    .withMessage(AuthConstants.passwordRequired)
    .escape(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorWithData(
          res,
          AuthConstants.validationError,
          errors.array()
        );
      } else {
        let identityProvided = false;
        let identityName;
        let user;
        console.log(req.body.mobile);
        console.log(req.body.email);
        const invite = await InviteModel.deleteOne({ email: req.body.email });

        if (req.body.email != undefined) {
          console.log("User provided email");
          user = await UserModel.findOne({
            email: req.body.email,
          });
          identityProvided = true;
          identityName = "email";
        }

        console.log("----------------------");
        console.log(user);
        console.log("----------------------");

        if (identityProvided == false) {
          return ErrorResponse(res, AuthConstants.emailOrMobileReq);
        }

        // User exists in DB
        if (user) {
          console.log("User already registered");
          return ErrorResponse(
            res,
            AuthConstants.alreadyRegistered +
            " with same " +
            identityName +
            ". " +
            AuthConstants.pleaseLogin
          );
        } else {
          console.log("Registering user");
          const {
            address,
            location,
            organisation,
            email,
            password,
            username,
            mobile,
            countryCode,
            role,
            plan,
            status,
            teacherId,
            classId,
            grade,
            itemail,
            fullName,
            lastName,
            firstName,
            schoolId
          } = req.body;
          const otp = utility.randomNumber(6);
          const hashPass = await bcrypt.hash(password, 10);

          const createData = {
            username,
            password: hashPass,
            confirmOTP: otp,
            role,
            plan,
            status,
          };

          if (address) {
            createData.address = address;
          }
          if (location) {
            createData.location = location;
          }
          if (organisation) {
            createData.organisation = organisation;
          }
          if (teacherId) {
            createData.teacherId = teacherId;
          }
          if (classId) {
            createData.classId = classId;
          }
          if (grade) {
            createData.grade = grade;
          }
          if (itemail) {
            createData.itemail = itemail;
          }
          if (fullName) {
            createData.fullName = fullName;
          }
          if (lastName) {
            createData.lastName = lastName;
          }
          if (firstName) {
            createData.firstName = firstName;
          }
          if (!email && !mobile) {
            console.log("Both email and mobile number not provided");
            return ErrorResponse(res, AuthConstants.emailOrMobileReq);
          }

          if (mobile && countryCode) {
            console.log("mobile number and country code provided");
            createData.mobile = `${countryCode}${mobile}`;
            createData.countryCode = countryCode;
          }

          if (email) {
            console.log("email is provided");
            createData.email = email;
          } else {
            console.log("Both email and mobile number are not provided");
            return ErrorResponse(res, AuthConstants.emailOrMobileReq);
          }
          createData.role = role;
          createData.plan = plan;
          createData.status = status;
          createData.isConfirmed = true;
          createData.schoolId = schoolId ? schoolId : '';

          console.log("createData : " + createData.username);
          console.log(createData.email);
          console.log(createData.mobile);
          console.log(createData.countryCode);

          //const message = `<#> ${otp} ` + AuthConstants.otpMessage;
          //await AWS_SNS.sendSMS(message, countryCode+mobile);
          try {
            const userData = await UserModel.create(createData);

            console.log("userData : " + userData);
            let userResponse = {};
            if (email) {
              console.log("Sending OTP to email : " + email);
              const template =
                '<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>    <meta charset="utf-8"> <meta name="viewport" content="width=device-width">     <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="x-apple-disable-message-reformatting">      <title></title> <link href="https://fonts.googleapis.com/css?family=verdana:300,400,700" rel="stylesheet">    <style> html,body {    margin: 0 auto !important;padding: 0 !important;height: 100% !important;width: 100% !important;background: #f1f1f1;}* {-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;}div[style*="margin: 16px 0"] {margin: 0 !important;}table,td {    mso-table-lspace: 0pt !important;    mso-table-rspace: 0pt !important;}table {    border-spacing: 0 !important;    border-collapse: collapse !important;    table-layout: fixed !important;    margin: 0 auto !important;}img {    -ms-interpolation-mode:bicubic;}a {    text-decoration: none;}*[x-apple-data-detectors],  .unstyle-auto-detected-links *,.aBn {    border-bottom: 0 !important;    cursor: default !important;     color: inherit !important;     text-decoration: none !important;     font-size: inherit !important;     font-family: inherit !important;     font-weight: inherit !important;     line-height: inherit !important; } .a6S {     display: none !important;     opacity: 0.01 !important; } .im {     color: inherit !important; } img.g-img + div {     display: none !important; } @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {     u ~ div .email-container {         min-width: 320px !important;     } } @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {     u ~ div .email-container {         min-width: 375px !important;     } } @media only screen and (min-device-width: 414px) {     u ~ div .email-container {         min-width: 414px !important;     } }     </style>     <style> 	    .primary{ 	background: #30e3ca; } .bg_white{ 	background: #ffffff; } .bg_light{ 	background: #fafafa; } .bg_black{ 	background: #000000; } .bg_dark{ 	background: rgba(0,0,0,.8); } .email-section{ 	padding:2.5em; } .btn{ 	padding: 10px 15px; 	display: inline-block; } .btn.btn-primary{ 	border-radius: 5px; 	background: #30e3ca; 	color: #ffffff; } .btn.btn-white{ 	border-radius: 5px; 	background: #ffffff; 	color: #000000; } .btn.btn-white-outline{ 	border-radius: 5px; 	background: transparent; 	border: 1px solid #fff; 	color: #fff; } .btn.btn-black-outline{ 	border-radius: 0px; 	background: transparent; 	border: 2px solid #000; 	color: #000; 	font-weight: 700; } h1,h2,h3,h4,h5,h6{ 	font-family: "verdana", sans-serif; 	color: #000000; 	margin-top: 0; 	font-weight: 400; } body{ 	font-family: "verdana", sans-serif; 	font-weight: 400; 	font-size: 15px; 	line-height: 1.8; 	color: rgba(0,0,0,.4); } a{ 	color: #30e3ca; } table{ } .logo h1{ 	margin: 0; } .logo h1 a{ 	color: #30e3ca; 	font-size: 24px; 	font-weight: 700; 	font-family: "verdana", sans-serif; } .hero{ 	position: relative; 	z-index: 0; } .hero .text{ 	color: rgba(0,0,0,.3); } .hero .text h2{ 	color: #000; 	font-size: 40px; 	margin-bottom: 0; 	font-weight: 400; 	line-height: 1.4; } .hero .text h3{ 	font-size: 24px; 	font-weight: 300; } .hero .text h2 span{ 	font-weight: 600; 	color: #30e3ca; } .heading-section{ } .heading-section h2{ 	color: #000000; 	font-size: 28px; 	margin-top: 0; 	line-height: 1.4; 	font-weight: 400; } .heading-section .subheading{ 	margin-bottom: 20px !important; 	display: inline-block; 	font-size: 13px; 	text-transform: uppercase; 	letter-spacing: 2px; 	color: rgba(0,0,0,.4); 	position: relative; } .heading-section .subheading::after{ 	position: absolute; 	left: 0; 	right: 0; 	bottom: -10px; 	width: 100%; 	height: 2px; 	background: #30e3ca; 	margin: 0 auto; } .heading-section-white{ 	color: rgba(255,255,255,.8); } .heading-section-white h2{ 	font-family: 	line-height: 1; 	padding-bottom: 0; } .heading-section-white h2{ 	color: #ffffff; } .heading-section-white .subheading{ 	margin-bottom: 0; 	display: inline-block; 	font-size: 13px; 	text-transform: uppercase; 	letter-spacing: 2px; 	color: rgba(255,255,255,.4); } ul.social{ 	padding: 0; } ul.social li{ 	display: inline-block; 	margin-right: 10px; } .footer{ 	border-top: 1px solid rgba(0,0,0,.05); 	color: rgba(0,0,0,.5); } .footer .heading{ 	color: #000; 	font-size: 20px; } .footer ul{ 	margin: 0; 	padding: 0; } .footer ul li{ 	list-style: none; 	margin-bottom: 10px; } .footer ul li a{ 	color: rgba(0,0,0,1); } @media screen and (max-width: 500px) { }     </style> </head> <body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f1f1f1;"> 	<center style="width: 100%; background-color: #f1f1f1;">     <div style="display: none; font-size: 1px;max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">       &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;     </div>     <div style="max-width: 600px; margin: 0 auto;" class="email-container">       <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto;">       	<tr>           <td valign="top" class="bg_white" style="padding: 1em 2.5em 0 2.5em;">           	<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">           	</table>           </td> 	      </tr> 	      <tr>           <td valign="middle" class="hero bg_white" style="padding: 3em 0 2em 0;">             <img src="https://class.thestreamboard.com/boards/tools/svg/logo-final.png" alt="" style="width: 300px; height: auto; margin: auto; display: block;">           </td> 	      </tr> 				<tr>           <td valign="middle" class="hero bg_white">             <table>             	<tr>             		<td>             			<div class="text" style="padding: 0 2.5em; text-align: center;"> 						<h3>Hi ' +
                userData.username +
                ',</h3>             				<h3>Registration Successfull  </h3>             				<h4>Please click the button below and create your own password.</h4>             				<p><a href="https://admin.thestreamboard.com/#/pages/authentication/reset-password-v2?id=' +
                userData.userId +
                '" class="btn btn-primary">Create Password</a></p>             			</div>             		</td>             	</tr>             </table>           </td> 	      </tr>       </table>     </div>   </center> </body> </html>';

              const createMasterData = {};
              createMasterData.userId = userData.userId;
              createMasterData.email = userData.email;
              createMasterData.role = role;
              await MasterModel.create(createMasterData);

              mailer(email, template);
              userResponse = {
                userId: userData.userId,
                username: userData.username,
                email: userData.email,
                otp: otp,
              };
            } else if (mobile) {
              console.log("Sending OTP to mobile number");
              const message = `<#> ${otp} ` + AuthConstants.otpMessage;
              //await AWS_SNS.sendSMS(message, countryCode+mobile);
              userResponse = {
                userId: userData.userId,
                username: userData.username,
                mobile: userData.mobile,
                otp: otp,
              };
            }

            console.log("Sending response to user");
            const activity = await ActivityModel.create({ user: userData._id, activityType: 'signup', info: { type: 'web', role } });
            console.log("AuthController:: register:: activity:: signup");
            return successResponseWithData(
              res,
              AuthConstants.registrationSuccessMsg,
              userResponse
            );
          } catch (err) {
            console.log(err);
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
      }
    } catch (err) {
      return ErrorResponse(res, err);
    }
  },
];

const registerTeacher = [
  body("username")
    .isString()
    .trim()
    .withMessage(AuthConstants.usernameRequired)
    .escape(),
  body("password")
    .isString()
    .trim()
    .withMessage(AuthConstants.passwordRequired)
    .escape(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorWithData(
          res,
          AuthConstants.validationError,
          errors.array()
        );
      } else {
        let identityProvided = false;
        let identityName;
        let user;
        console.log(req.body.mobile);
        console.log(req.body.email);

        if (req.body.email != undefined) {
          console.log("User provided email");
          user = await TeacherModel.findOne({
            email: req.body.email,
          });
          identityProvided = true;
          identityName = "email";
        }

        console.log("----------------------");
        console.log(user);
        console.log("----------------------");

        if (identityProvided == false) {
          return ErrorResponse(res, AuthConstants.emailOrMobileReq);
        }

        // User exists in DB
        if (user) {
          console.log("Teacher already registered");
          return ErrorResponse(
            res,
            AuthConstants.alreadyRegistered +
            " with same " +
            identityName +
            ". " +
            AuthConstants.pleaseLogin
          );
        } else {
          console.log("Registering Teacher");
          // const {address,location,organisation, email, password, username, mobile, countryCode, role, plan, status, teacherId, classId,grade } = req.body;
          const {
            schoolId,
            username,
            firstName,
            lastName,
            organisation,
            subject,
            email,
            password,
            mobile,
            countryCode,
            role,
            plan,
            status,
            classId,
            classes,
            grade,
          } = req.body;

          const otp = utility.randomNumber(6);
          const hashPass = await bcrypt.hash(password, 10);

          const createData = {
            email,
            password: hashPass,
            confirmOTP: otp,
          };

          if (organisation) {
            createData.organisation = organisation;
          }
          if (schoolId) {
            createData.schoolId = schoolId;
          }
          if (classId) {
            createData.classId = classId;
          }
          if (grade) {
            createData.grade = grade;
          }
          if (subject) {
            createData.subject = subject;
          }
          if (!email && !mobile) {
            console.log("Both email and mobile number not provided");
            return ErrorResponse(res, AuthConstants.emailOrMobileReq);
          }

          if (mobile && countryCode) {
            console.log("mobile number and country code provided");
            createData.mobile = `${countryCode}${mobile}`;
            createData.countryCode = countryCode;
          }

          if (email) {
            console.log("email is provided");
            createData.email = email;
          } else {
            console.log("Both email and mobile number are not provided");
            return ErrorResponse(res, AuthConstants.emailOrMobileReq);
          }
          createData.firstName = firstName;
          createData.lastName = lastName;
          createData.role = "Teacher";
          createData.plan = "Free";
          createData.status = "active";
          createData.username = username;
          createData.classes = classes;

          console.log("createData : " + createData.username);
          console.log(createData.email);
          console.log(createData.mobile);
          console.log(createData.countryCode);

          //const message = `<#> ${otp} ` + AuthConstants.otpMessage;
          //await AWS_SNS.sendSMS(message, countryCode+mobile);
          try {
            const teacherData = await TeacherModel.create(createData);
            const template =
              '<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>    <meta charset="utf-8"> <meta name="viewport" content="width=device-width">     <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="x-apple-disable-message-reformatting">      <title></title> <link href="https://fonts.googleapis.com/css?family=verdana:300,400,700" rel="stylesheet">    <style> html,body {    margin: 0 auto !important;padding: 0 !important;height: 100% !important;width: 100% !important;background: #f1f1f1;}* {-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;}div[style*="margin: 16px 0"] {margin: 0 !important;}table,td {    mso-table-lspace: 0pt !important;    mso-table-rspace: 0pt !important;}table {    border-spacing: 0 !important;    border-collapse: collapse !important;    table-layout: fixed !important;    margin: 0 auto !important;}img {    -ms-interpolation-mode:bicubic;}a {    text-decoration: none;}*[x-apple-data-detectors],  .unstyle-auto-detected-links *,.aBn {    border-bottom: 0 !important;    cursor: default !important;     color: inherit !important;     text-decoration: none !important;     font-size: inherit !important;     font-family: inherit !important;     font-weight: inherit !important;     line-height: inherit !important; } .a6S {     display: none !important;     opacity: 0.01 !important; } .im {     color: inherit !important; } img.g-img + div {     display: none !important; } @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {     u ~ div .email-container {         min-width: 320px !important;     } } @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {     u ~ div .email-container {         min-width: 375px !important;     } } @media only screen and (min-device-width: 414px) {     u ~ div .email-container {         min-width: 414px !important;     } }     </style>     <style> 	    .primary{ 	background: #30e3ca; } .bg_white{ 	background: #ffffff; } .bg_light{ 	background: #fafafa; } .bg_black{ 	background: #000000; } .bg_dark{ 	background: rgba(0,0,0,.8); } .email-section{ 	padding:2.5em; } .btn{ 	padding: 10px 15px; 	display: inline-block; } .btn.btn-primary{ 	border-radius: 5px; 	background: #30e3ca; 	color: #ffffff; } .btn.btn-white{ 	border-radius: 5px; 	background: #ffffff; 	color: #000000; } .btn.btn-white-outline{ 	border-radius: 5px; 	background: transparent; 	border: 1px solid #fff; 	color: #fff; } .btn.btn-black-outline{ 	border-radius: 0px; 	background: transparent; 	border: 2px solid #000; 	color: #000; 	font-weight: 700; } h1,h2,h3,h4,h5,h6{ 	font-family: "verdana", sans-serif; 	color: #000000; 	margin-top: 0; 	font-weight: 400; } body{ 	font-family: "verdana", sans-serif; 	font-weight: 400; 	font-size: 15px; 	line-height: 1.8; 	color: rgba(0,0,0,.4); } a{ 	color: #30e3ca; } table{ } .logo h1{ 	margin: 0; } .logo h1 a{ 	color: #30e3ca; 	font-size: 24px; 	font-weight: 700; 	font-family: "verdana", sans-serif; } .hero{ 	position: relative; 	z-index: 0; } .hero .text{ 	color: rgba(0,0,0,.3); } .hero .text h2{ 	color: #000; 	font-size: 40px; 	margin-bottom: 0; 	font-weight: 400; 	line-height: 1.4; } .hero .text h3{ 	font-size: 24px; 	font-weight: 300; } .hero .text h2 span{ 	font-weight: 600; 	color: #30e3ca; } .heading-section{ } .heading-section h2{ 	color: #000000; 	font-size: 28px; 	margin-top: 0; 	line-height: 1.4; 	font-weight: 400; } .heading-section .subheading{ 	margin-bottom: 20px !important; 	display: inline-block; 	font-size: 13px; 	text-transform: uppercase; 	letter-spacing: 2px; 	color: rgba(0,0,0,.4); 	position: relative; } .heading-section .subheading::after{ 	position: absolute; 	left: 0; 	right: 0; 	bottom: -10px; 	width: 100%; 	height: 2px; 	background: #30e3ca; 	margin: 0 auto; } .heading-section-white{ 	color: rgba(255,255,255,.8); } .heading-section-white h2{ 	font-family: 	line-height: 1; 	padding-bottom: 0; } .heading-section-white h2{ 	color: #ffffff; } .heading-section-white .subheading{ 	margin-bottom: 0; 	display: inline-block; 	font-size: 13px; 	text-transform: uppercase; 	letter-spacing: 2px; 	color: rgba(255,255,255,.4); } ul.social{ 	padding: 0; } ul.social li{ 	display: inline-block; 	margin-right: 10px; } .footer{ 	border-top: 1px solid rgba(0,0,0,.05); 	color: rgba(0,0,0,.5); } .footer .heading{ 	color: #000; 	font-size: 20px; } .footer ul{ 	margin: 0; 	padding: 0; } .footer ul li{ 	list-style: none; 	margin-bottom: 10px; } .footer ul li a{ 	color: rgba(0,0,0,1); } @media screen and (max-width: 500px) { }     </style> </head> <body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f1f1f1;"> 	<center style="width: 100%; background-color: #f1f1f1;">     <div style="display: none; font-size: 1px;max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">       &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;     </div>     <div style="max-width: 600px; margin: 0 auto;" class="email-container">       <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto;">       	<tr>           <td valign="top" class="bg_white" style="padding: 1em 2.5em 0 2.5em;">           	<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">           	</table>           </td> 	      </tr> 	      <tr>           <td valign="middle" class="hero bg_white" style="padding: 3em 0 2em 0;">             <img src="https://class.thestreamboard.com/boards/tools/svg/logo-final.png" alt="" style="width: 300px; height: auto; margin: auto; display: block;">           </td> 	      </tr> 				<tr>           <td valign="middle" class="hero bg_white">             <table>             	<tr>             		<td>             			<div class="text" style="padding: 0 2.5em; text-align: center;"> 						<h3>Hi ' +
              teacherData.username +
              ',</h3>             				<h3>Registration Successfull  </h3>             				<h4>Please click the button below and create your own password.</h4>             				<p><a href="https://admin.thestreamboard.com/#/pages/authentication/reset-password-v2?id=' +
              teacherData.userId +
              '" class="btn btn-primary">Create Password</a></p>             			</div>             		</td>             	</tr>             </table>           </td> 	      </tr>       </table>     </div>   </center> </body> </html>';
            console.log("teacherData : " + teacherData);
            let userResponse = {};
            if (email) {
              console.log("Sending password reset email : " + email);
              mailer(email, template);
              const createMasterData = {};
              createMasterData.userId = teacherData.userId;
              createMasterData.email = teacherData.email;
              createMasterData.role = "Teacher";
              await MasterModel.create(createMasterData);

              userResponse = {
                userId: teacherData.userId,
                username: teacherData.firstName + " " + teacherData.lastName,
                email: teacherData.email,
                otp: otp,
              };
            }

            console.log("Sending response to user");
            const activity = await ActivityModel.create({ user: teacherData._id, activityType: 'signup', info: { type: 'web', role: 'Teacher' } });
            console.log("AuthController:: registerTeacher:: activity:: signup");
            return successResponseWithData(
              res,
              AuthConstants.registrationSuccessMsg,
              userResponse
            );
          } catch (err) {
            console.log(err);
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
      }
    } catch (err) {
      return ErrorResponse(res, err);
    }
  },
];



const bulkRegisterTeacher = [
  body().isArray(),
  body("*.username")
    .isString()
    .trim()
    .withMessage(AuthConstants.usernameRequired)
    .escape(),
  body("*.password")
    .isString()
    .trim()
    .withMessage(AuthConstants.passwordRequired)
    .escape(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorWithData(
          res,
          AuthConstants.validationError,
          errors.array()
        );
      } else {
        let registerArrProm = [];
        if (Array.isArray(req.body)) {
          req.body.forEach(user => {
            registerArrProm.push(registerSingleTeacher(user))
          });
          const resp = await Promise.all(registerArrProm);
          return successResponseWithData(res, AuthConstants.registrationSuccessMsg, resp);
        }
      }
    } catch (err) {
      return ErrorResponse(res, err);
    }
  },
];

function registerSingleTeacher(singleUser) {
  return new Promise(async (resolve, reject) => {
    let identityProvided = false;
    let identityName;
    let user;
    console.log(singleUser.mobile);
    console.log(singleUser.email);

    if (singleUser.email != undefined) {
      console.log("User provided email");
      user = await TeacherModel.findOne({
        email: singleUser.email,
      });
      identityProvided = true;
      identityName = "email";
    }

    console.log("----------------------");
    console.log(user);
    console.log("----------------------");

    if (identityProvided == false) {
      resolve({
        type: 'error',
        message: AuthConstants.emailOrMobileReq,
        data: [{
          email: singleUser.email
        }]
      });
      // return ErrorResponse(res, AuthConstants.emailOrMobileReq);
    }

    // User exists in DB
    if (user) {
      console.log("Teacher already registered");
      resolve({
        type: 'error',
        message: AuthConstants.alreadyRegistered + " with same " + identityName + ". " + AuthConstants.pleaseLogin,
        data: [{
          email: singleUser.email
        }]
      });
      // return ErrorResponse(
      //   res,
      //   AuthConstants.alreadyRegistered +
      //   " with same " +
      //   identityName +
      //   ". " +
      //   AuthConstants.pleaseLogin
      // );
    } else {
      console.log("Registering Teacher");
      // const {address,location,organisation, email, password, username, mobile, countryCode, role, plan, status, teacherId, classId,grade } = user;
      const {
        schoolId,
        username,
        firstName,
        lastName,
        organisation,
        subject,
        email,
        password,
        mobile,
        countryCode,
        role,
        plan,
        status,
        classId,
        classes,
        grade,
      } = singleUser;

      const otp = utility.randomNumber(6);
      const hashPass = await bcrypt.hash(password, 10);
      const classesSelected = await ClassModel.find({ shortId: { $in: classes } }, { _id: 1, className: 1 }).lean();

      const createData = {
        email,
        password: hashPass,
        confirmOTP: otp
      };

      if (organisation) {
        createData.organisation = organisation;
      }
      if (schoolId) {
        createData.schoolId = schoolId;
      }
      if (classId) {
        createData.classId = classId;
      }
      if (grade) {
        createData.grade = grade;
      }
      if (subject) {
        createData.subject = subject;
      }
      if (!email && !mobile) {
        console.log("Both email and mobile number not provided");
        resolve({
          type: 'error',
          message: AuthConstants.emailOrMobileReq,
          data: [{
            email: singleUser.email
          }]
        });

        // return ErrorResponse(res, AuthConstants.emailOrMobileReq);
      }

      if (mobile && countryCode) {
        console.log("mobile number and country code provided");
        createData.mobile = `${countryCode}${mobile}`;
        createData.countryCode = countryCode;
      }

      if (email) {
        console.log("email is provided");
        createData.email = email;
      } else {
        console.log("Both email and mobile number are not provided");
        resolve({
          type: 'error',
          message: AuthConstants.emailOrMobileReq,
          data: [{
            email: singleUser.email
          }]
        });
        // return ErrorResponse(res, AuthConstants.emailOrMobileReq);
      }
      createData.firstName = firstName;
      createData.lastName = lastName;
      createData.role = "Teacher";
      createData.plan = "Free";
      createData.status = "active";
      createData.username = username;
      createData.classes = classesSelected || [];

      console.log("createData : " + createData.username);
      console.log(createData.email);
      console.log(createData.mobile);
      console.log(createData.countryCode);

      //const message = `<#> ${otp} ` + AuthConstants.otpMessage;
      //await AWS_SNS.sendSMS(message, countryCode+mobile);
      try {
        const teacherData = await TeacherModel.create(createData);
        const template =
          '<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>    <meta charset="utf-8"> <meta name="viewport" content="width=device-width">     <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="x-apple-disable-message-reformatting">      <title></title> <link href="https://fonts.googleapis.com/css?family=verdana:300,400,700" rel="stylesheet">    <style> html,body {    margin: 0 auto !important;padding: 0 !important;height: 100% !important;width: 100% !important;background: #f1f1f1;}* {-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;}div[style*="margin: 16px 0"] {margin: 0 !important;}table,td {    mso-table-lspace: 0pt !important;    mso-table-rspace: 0pt !important;}table {    border-spacing: 0 !important;    border-collapse: collapse !important;    table-layout: fixed !important;    margin: 0 auto !important;}img {    -ms-interpolation-mode:bicubic;}a {    text-decoration: none;}*[x-apple-data-detectors],  .unstyle-auto-detected-links *,.aBn {    border-bottom: 0 !important;    cursor: default !important;     color: inherit !important;     text-decoration: none !important;     font-size: inherit !important;     font-family: inherit !important;     font-weight: inherit !important;     line-height: inherit !important; } .a6S {     display: none !important;     opacity: 0.01 !important; } .im {     color: inherit !important; } img.g-img + div {     display: none !important; } @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {     u ~ div .email-container {         min-width: 320px !important;     } } @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {     u ~ div .email-container {         min-width: 375px !important;     } } @media only screen and (min-device-width: 414px) {     u ~ div .email-container {         min-width: 414px !important;     } }     </style>     <style> 	    .primary{ 	background: #30e3ca; } .bg_white{ 	background: #ffffff; } .bg_light{ 	background: #fafafa; } .bg_black{ 	background: #000000; } .bg_dark{ 	background: rgba(0,0,0,.8); } .email-section{ 	padding:2.5em; } .btn{ 	padding: 10px 15px; 	display: inline-block; } .btn.btn-primary{ 	border-radius: 5px; 	background: #30e3ca; 	color: #ffffff; } .btn.btn-white{ 	border-radius: 5px; 	background: #ffffff; 	color: #000000; } .btn.btn-white-outline{ 	border-radius: 5px; 	background: transparent; 	border: 1px solid #fff; 	color: #fff; } .btn.btn-black-outline{ 	border-radius: 0px; 	background: transparent; 	border: 2px solid #000; 	color: #000; 	font-weight: 700; } h1,h2,h3,h4,h5,h6{ 	font-family: "verdana", sans-serif; 	color: #000000; 	margin-top: 0; 	font-weight: 400; } body{ 	font-family: "verdana", sans-serif; 	font-weight: 400; 	font-size: 15px; 	line-height: 1.8; 	color: rgba(0,0,0,.4); } a{ 	color: #30e3ca; } table{ } .logo h1{ 	margin: 0; } .logo h1 a{ 	color: #30e3ca; 	font-size: 24px; 	font-weight: 700; 	font-family: "verdana", sans-serif; } .hero{ 	position: relative; 	z-index: 0; } .hero .text{ 	color: rgba(0,0,0,.3); } .hero .text h2{ 	color: #000; 	font-size: 40px; 	margin-bottom: 0; 	font-weight: 400; 	line-height: 1.4; } .hero .text h3{ 	font-size: 24px; 	font-weight: 300; } .hero .text h2 span{ 	font-weight: 600; 	color: #30e3ca; } .heading-section{ } .heading-section h2{ 	color: #000000; 	font-size: 28px; 	margin-top: 0; 	line-height: 1.4; 	font-weight: 400; } .heading-section .subheading{ 	margin-bottom: 20px !important; 	display: inline-block; 	font-size: 13px; 	text-transform: uppercase; 	letter-spacing: 2px; 	color: rgba(0,0,0,.4); 	position: relative; } .heading-section .subheading::after{ 	position: absolute; 	left: 0; 	right: 0; 	bottom: -10px; 	width: 100%; 	height: 2px; 	background: #30e3ca; 	margin: 0 auto; } .heading-section-white{ 	color: rgba(255,255,255,.8); } .heading-section-white h2{ 	font-family: 	line-height: 1; 	padding-bottom: 0; } .heading-section-white h2{ 	color: #ffffff; } .heading-section-white .subheading{ 	margin-bottom: 0; 	display: inline-block; 	font-size: 13px; 	text-transform: uppercase; 	letter-spacing: 2px; 	color: rgba(255,255,255,.4); } ul.social{ 	padding: 0; } ul.social li{ 	display: inline-block; 	margin-right: 10px; } .footer{ 	border-top: 1px solid rgba(0,0,0,.05); 	color: rgba(0,0,0,.5); } .footer .heading{ 	color: #000; 	font-size: 20px; } .footer ul{ 	margin: 0; 	padding: 0; } .footer ul li{ 	list-style: none; 	margin-bottom: 10px; } .footer ul li a{ 	color: rgba(0,0,0,1); } @media screen and (max-width: 500px) { }     </style> </head> <body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f1f1f1;"> 	<center style="width: 100%; background-color: #f1f1f1;">     <div style="display: none; font-size: 1px;max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">       &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;     </div>     <div style="max-width: 600px; margin: 0 auto;" class="email-container">       <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto;">       	<tr>           <td valign="top" class="bg_white" style="padding: 1em 2.5em 0 2.5em;">           	<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">           	</table>           </td> 	      </tr> 	      <tr>           <td valign="middle" class="hero bg_white" style="padding: 3em 0 2em 0;">             <img src="https://class.thestreamboard.com/boards/tools/svg/logo-final.png" alt="" style="width: 300px; height: auto; margin: auto; display: block;">           </td> 	      </tr> 				<tr>           <td valign="middle" class="hero bg_white">             <table>             	<tr>             		<td>             			<div class="text" style="padding: 0 2.5em; text-align: center;"> 						<h3>Hi ' +
          teacherData.username +
          ',</h3>             				<h3>Registration Successfull  </h3>             				<h4>Please click the button below and create your own password.</h4>             				<p><a href="https://admin.thestreamboard.com/#/pages/authentication/reset-password-v2?id=' +
          teacherData.userId +
          '" class="btn btn-primary">Create Password</a></p>             			</div>             		</td>             	</tr>             </table>           </td> 	      </tr>       </table>     </div>   </center> </body> </html>';
        console.log("teacherData : " + teacherData);
        let userResponse = {};
        if (email) {
          console.log("Sending password reset email : " + email);
          mailer(email, template);
          const createMasterData = {};
          createMasterData.userId = teacherData.userId;
          createMasterData.email = teacherData.email;
          createMasterData.role = "Teacher";
          await MasterModel.create(createMasterData);

          userResponse = {
            userId: teacherData.userId,
            username: teacherData.firstName + " " + teacherData.lastName,
            email: teacherData.email,
            otp: otp,
          };
        }

        console.log("Sending response to user");
        const activity = await ActivityModel.create({ user: teacherData._id, activityType: 'signup', info: { type: 'web', role: 'Teacher' } });
        console.log("AuthController:: registerTeacher:: activity:: signup");
        resolve({ message: AuthConstants.registrationSuccessMsg, email: singleUser.email });
      } catch (err) {
        console.log(err);
        if (err.code === 11000) {
          let str = "";
          Object.keys(err.keyPattern).forEach((d) => {
            str += `${d}, `;
          });
          str = str.slice(0, str.length - 2);
          resolve({
            userResponse,
            data: [{
              email: student.email
            }]
          });
        }
      }
    }
  });
}

const registerStudent = [
  body("email")
    .isString()
    .trim()
    .withMessage(AuthConstants.usernameRequired)
    .escape(),
  body("password")
    .isString()
    .trim()
    .withMessage(AuthConstants.passwordRequired)
    .escape(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorWithData(
          res,
          AuthConstants.validationError,
          errors.array()
        );
      } else {
        let identityProvided = false;
        let identityName;
        let user;
        console.log(req.body.mobile);
        console.log(req.body.email);

        if (req.body.email != undefined) {
          console.log("User provided email");
          user = await StudentModel.findOne({
            email: req.body.email,
          });
          identityProvided = true;
          identityName = "email";
        }

        console.log("----------------------");
        console.log(user);
        console.log("----------------------");

        if (identityProvided == false) {
          return ErrorResponse(res, AuthConstants.emailOrMobileReq);
        }

        // User exists in DB
        if (user) {
          console.log("student already registered");
          return ErrorResponse(
            res,
            AuthConstants.alreadyRegistered +
            " with same " +
            identityName +
            ". " +
            AuthConstants.pleaseLogin
          );
        } else {
          console.log("Registering student");
          // const {address,location,organisation, email, password, username, mobile, countryCode, role, plan, status, teacherId, classId,grade } = req.body;
          const {
            schoolId,
            username,
            firstName,
            lastName,
            organisation,
            subject,
            email,
            password,
            mobile,
            countryCode,
            role,
            plan,
            status,
            classId,
            grades,
            classes,
            teacherId,
            teachers
          } = req.body;
          const otp = utility.randomNumber(6);
          const hashPass = await bcrypt.hash(password, 10);

          const createData = {
            email,
            password: hashPass,
            confirmOTP: otp,
          };

          if (organisation) {
            createData.organisation = organisation;
          }
          if (schoolId) {
            createData.schoolId = schoolId;
          }
          if (teacherId) {
            createData.teacherId = [teacherId];
          }
          if (classes) {
            createData.classes = classes;
          }
          if (grades) {
            createData.grades = grades;
          }
          if (subject) {
            createData.subject = subject;
          }
          if (!email && !mobile) {
            console.log("Both email and mobile number not provided");
            return ErrorResponse(res, AuthConstants.emailOrMobileReq);
          }

          if (mobile && countryCode) {
            console.log("mobile number and country code provided");
            createData.mobile = `${countryCode}${mobile}`;
            createData.countryCode = countryCode;
          }

          if (email) {
            console.log("email is provided");
            createData.email = email;
          } else {
            console.log("Both email and mobile number are not provided");
            return ErrorResponse(res, AuthConstants.emailOrMobileReq);
          }
          createData.firstName = firstName;
          createData.lastName = lastName;
          createData.role = "Student";
          createData.plan = "Free";
          createData.status = "active";
          createData.username = username;
          createData.teachers = teachers;
          console.log("createData : " + createData.username);
          console.log(createData.email);
          console.log(createData.mobile);
          console.log(createData.countryCode);

          //const message = `<#> ${otp} ` + AuthConstants.otpMessage;
          //await AWS_SNS.sendSMS(message, countryCode+mobile);
          try {
            const studentData = await StudentModel.create(createData);
            const template =
              '<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>    <meta charset="utf-8"> <meta name="viewport" content="width=device-width">     <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="x-apple-disable-message-reformatting">      <title></title> <link href="https://fonts.googleapis.com/css?family=verdana:300,400,700" rel="stylesheet">    <style> html,body {    margin: 0 auto !important;padding: 0 !important;height: 100% !important;width: 100% !important;background: #f1f1f1;}* {-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;}div[style*="margin: 16px 0"] {margin: 0 !important;}table,td {    mso-table-lspace: 0pt !important;    mso-table-rspace: 0pt !important;}table {    border-spacing: 0 !important;    border-collapse: collapse !important;    table-layout: fixed !important;    margin: 0 auto !important;}img {    -ms-interpolation-mode:bicubic;}a {    text-decoration: none;}*[x-apple-data-detectors],  .unstyle-auto-detected-links *,.aBn {    border-bottom: 0 !important;    cursor: default !important;     color: inherit !important;     text-decoration: none !important;     font-size: inherit !important;     font-family: inherit !important;     font-weight: inherit !important;     line-height: inherit !important; } .a6S {     display: none !important;     opacity: 0.01 !important; } .im {     color: inherit !important; } img.g-img + div {     display: none !important; } @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {     u ~ div .email-container {         min-width: 320px !important;     } } @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {     u ~ div .email-container {         min-width: 375px !important;     } } @media only screen and (min-device-width: 414px) {     u ~ div .email-container {         min-width: 414px !important;     } }     </style>     <style> 	    .primary{ 	background: #30e3ca; } .bg_white{ 	background: #ffffff; } .bg_light{ 	background: #fafafa; } .bg_black{ 	background: #000000; } .bg_dark{ 	background: rgba(0,0,0,.8); } .email-section{ 	padding:2.5em; } .btn{ 	padding: 10px 15px; 	display: inline-block; } .btn.btn-primary{ 	border-radius: 5px; 	background: #30e3ca; 	color: #ffffff; } .btn.btn-white{ 	border-radius: 5px; 	background: #ffffff; 	color: #000000; } .btn.btn-white-outline{ 	border-radius: 5px; 	background: transparent; 	border: 1px solid #fff; 	color: #fff; } .btn.btn-black-outline{ 	border-radius: 0px; 	background: transparent; 	border: 2px solid #000; 	color: #000; 	font-weight: 700; } h1,h2,h3,h4,h5,h6{ 	font-family: "verdana", sans-serif; 	color: #000000; 	margin-top: 0; 	font-weight: 400; } body{ 	font-family: "verdana", sans-serif; 	font-weight: 400; 	font-size: 15px; 	line-height: 1.8; 	color: rgba(0,0,0,.4); } a{ 	color: #30e3ca; } table{ } .logo h1{ 	margin: 0; } .logo h1 a{ 	color: #30e3ca; 	font-size: 24px; 	font-weight: 700; 	font-family: "verdana", sans-serif; } .hero{ 	position: relative; 	z-index: 0; } .hero .text{ 	color: rgba(0,0,0,.3); } .hero .text h2{ 	color: #000; 	font-size: 40px; 	margin-bottom: 0; 	font-weight: 400; 	line-height: 1.4; } .hero .text h3{ 	font-size: 24px; 	font-weight: 300; } .hero .text h2 span{ 	font-weight: 600; 	color: #30e3ca; } .heading-section{ } .heading-section h2{ 	color: #000000; 	font-size: 28px; 	margin-top: 0; 	line-height: 1.4; 	font-weight: 400; } .heading-section .subheading{ 	margin-bottom: 20px !important; 	display: inline-block; 	font-size: 13px; 	text-transform: uppercase; 	letter-spacing: 2px; 	color: rgba(0,0,0,.4); 	position: relative; } .heading-section .subheading::after{ 	position: absolute; 	left: 0; 	right: 0; 	bottom: -10px; 	width: 100%; 	height: 2px; 	background: #30e3ca; 	margin: 0 auto; } .heading-section-white{ 	color: rgba(255,255,255,.8); } .heading-section-white h2{ 	font-family: 	line-height: 1; 	padding-bottom: 0; } .heading-section-white h2{ 	color: #ffffff; } .heading-section-white .subheading{ 	margin-bottom: 0; 	display: inline-block; 	font-size: 13px; 	text-transform: uppercase; 	letter-spacing: 2px; 	color: rgba(255,255,255,.4); } ul.social{ 	padding: 0; } ul.social li{ 	display: inline-block; 	margin-right: 10px; } .footer{ 	border-top: 1px solid rgba(0,0,0,.05); 	color: rgba(0,0,0,.5); } .footer .heading{ 	color: #000; 	font-size: 20px; } .footer ul{ 	margin: 0; 	padding: 0; } .footer ul li{ 	list-style: none; 	margin-bottom: 10px; } .footer ul li a{ 	color: rgba(0,0,0,1); } @media screen and (max-width: 500px) { }     </style> </head> <body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f1f1f1;"> 	<center style="width: 100%; background-color: #f1f1f1;">     <div style="display: none; font-size: 1px;max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">       &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;     </div>     <div style="max-width: 600px; margin: 0 auto;" class="email-container">       <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto;">       	<tr>           <td valign="top" class="bg_white" style="padding: 1em 2.5em 0 2.5em;">           	<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">           	</table>           </td> 	      </tr> 	      <tr>           <td valign="middle" class="hero bg_white" style="padding: 3em 0 2em 0;">             <img src="https://class.thestreamboard.com/boards/tools/svg/logo-final.png" alt="" style="width: 300px; height: auto; margin: auto; display: block;">           </td> 	      </tr> 				<tr>           <td valign="middle" class="hero bg_white">             <table>             	<tr>             		<td>             			<div class="text" style="padding: 0 2.5em; text-align: center;"> 						<h3>Hi ' +
              studentData.username +
              ',</h3>             				<h3>Registration Successfull  </h3>             				<h4>Please click the button below and create your own password.</h4>             				<p><a href="https://admin.thestreamboard.com/#/pages/authentication/reset-password-v2?id=' +
              studentData.userId +
              '" class="btn btn-primary">Create Password</a></p>             			</div>             		</td>             	</tr>             </table>           </td> 	      </tr>       </table>     </div>   </center> </body> </html>';

            console.log("studentData : " + studentData);
            let userResponse = {};
            if (email) {
              console.log("Sending password reset email  : " + email);
              mailer(email, template);

              const createMasterData = {};
              createMasterData.userId = studentData.userId;
              createMasterData.email = studentData.email;
              createMasterData.role = "Student";
              await MasterModel.create(createMasterData);

              userResponse = {
                userId: studentData.userId,
                username: studentData.firstName + " " + studentData.lastName,
                email: studentData.email,
                otp: otp,
              };
            }

            console.log("Sending response to user");
            const activity = await ActivityModel.create({ user: studentData._id, activityType: 'signup', info: { type: 'web', role: 'Student' } });
            console.log("AuthController:: registerTeacher:: activity:: signup");
            return successResponseWithData(
              res,
              AuthConstants.registrationSuccessMsg,
              userResponse
            );
          } catch (err) {
            console.log(err);
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
      }
    } catch (err) {
      return ErrorResponse(res, err);
    }
  },
];

const bulkRegisterStudent = [
  body().isArray(),
  body("*.email")
    .isString()
    .trim()
    .withMessage(AuthConstants.usernameRequired)
    .escape(),
  body("*.password")
    .isString()
    .trim()
    .withMessage(AuthConstants.passwordRequired)
    .escape(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorWithData(
          res,
          AuthConstants.validationError,
          errors.array()
        );
      } else {
        let registerArrProm = [];
        if (Array.isArray(req.body)) {
          req.body.forEach(user => {
            registerArrProm.push(registerSingleStudent(user))
          });
          const resp = await Promise.all(registerArrProm);
          return successResponseWithData(res, AuthConstants.registrationSuccessMsg, resp);
        }

      }
    } catch (err) {
      return ErrorResponse(res, err);
    }
  },
];

function registerSingleStudent(student) {
  return new Promise(async (resolve, reject) => {

    let identityProvided = false;
    let identityName;
    let user;
    console.log(student.mobile);
    console.log(student.email);

    if (student.email != undefined) {
      console.log("User provided email");
      user = await StudentModel.findOne({
        email: student.email,
      });
      identityProvided = true;
      identityName = "email";
    }

    console.log("----------------------");
    console.log(user);
    console.log("----------------------");

    if (identityProvided == false) {
      resolve({
        type: 'error',
        message: AuthConstants.emailOrMobileReq,
        data: [{
          email: student.email
        }]
      });
      // return ErrorResponse(res, AuthConstants.emailOrMobileReq);
    }

    // User exists in DB
    if (user) {
      resolve({
        type: 'error',
        message: AuthConstants.alreadyRegistered +
          " with same " +
          identityName +
          ". " +
          AuthConstants.pleaseLogin,
        data: [{
          email: student.email,
        }]
      });
      console.log("student already registered");
      // return ErrorResponse(
      //   res,
      //   AuthConstants.alreadyRegistered +
      //   " with same " +
      //   identityName +
      //   ". " +
      //   AuthConstants.pleaseLogin
      // );
    } else {
      console.log("Registering student");
      // const {address,location,organisation, email, password, username, mobile, countryCode, role, plan, status, teacherId, classId,grade } = req.body;
      const {
        schoolId,
        username,
        firstName,
        lastName,
        organisation,
        subject,
        email,
        password,
        mobile,
        countryCode,
        role,
        plan,
        status,
        classId,
        grades,
        classes,
        teacherId,
        teachers
      } = student;
      const otp = utility.randomNumber(6);
      const hashPass = await bcrypt.hash(password, 10);

      const createData = {
        email,
        password: hashPass,
        confirmOTP: otp,
      };

      if (organisation) {
        createData.organisation = organisation;
      }
      if (schoolId) {
        createData.schoolId = schoolId;
      }
      if (teacherId) {
        createData.teacherId = [teacherId];
      }

      if (subject) {
        createData.subject = subject;
      }
      if (!email && !mobile) {
        console.log("Both email and mobile number not provided");
        resolve({
          type: 'error',
          message: AuthConstants.emailOrMobileReq,
          data: [{
            email: student.email
          }]
        });
        // return ErrorResponse(res, AuthConstants.emailOrMobileReq);
      }

      if (mobile && countryCode) {
        console.log("mobile number and country code provided");
        createData.mobile = `${countryCode}${mobile}`;
        createData.countryCode = countryCode;
      }

      if (email) {
        console.log("email is provided");
        createData.email = email;
      } else {
        console.log("Both email and mobile number are not provided");
        resolve({
          type: 'error',
          message: AuthConstants.emailOrMobileReq,
          data: [{
            email: student.email
          }]
        });
        // return ErrorResponse(res, AuthConstants.emailOrMobileReq);
      }
      const selectedTeachers = await TeacherModel.find({ shortId: { $in: teachers } }, { _id: 1, username: 1 }).lean();
      const selectedClasses = await ClassModel.findOne({ shortId: classes }, { _id: 1 }).lean();
      const selectedGrades = await GradesModel.findOne({ shortId: grades }, { _id: 1 }).lean();

      if (classes) {
        createData.classes = selectedClasses._id || '';
      }
      if (grades) {
        createData.grades = selectedGrades._id || '';
      }

      createData.firstName = firstName;
      createData.lastName = lastName;
      createData.role = "Student";
      createData.plan = "Free";
      createData.status = "active";
      createData.username = username;
      createData.teachers = selectedTeachers;
      console.log("createData : " + createData.username);
      console.log(createData.email);
      console.log(createData.mobile);
      console.log(createData.countryCode);

      //const message = `<#> ${otp} ` + AuthConstants.otpMessage;
      //await AWS_SNS.sendSMS(message, countryCode+mobile);
      try {
        const studentData = await StudentModel.create(createData);
        const template =
          '<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>    <meta charset="utf-8"> <meta name="viewport" content="width=device-width">     <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="x-apple-disable-message-reformatting">      <title></title> <link href="https://fonts.googleapis.com/css?family=verdana:300,400,700" rel="stylesheet">    <style> html,body {    margin: 0 auto !important;padding: 0 !important;height: 100% !important;width: 100% !important;background: #f1f1f1;}* {-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;}div[style*="margin: 16px 0"] {margin: 0 !important;}table,td {    mso-table-lspace: 0pt !important;    mso-table-rspace: 0pt !important;}table {    border-spacing: 0 !important;    border-collapse: collapse !important;    table-layout: fixed !important;    margin: 0 auto !important;}img {    -ms-interpolation-mode:bicubic;}a {    text-decoration: none;}*[x-apple-data-detectors],  .unstyle-auto-detected-links *,.aBn {    border-bottom: 0 !important;    cursor: default !important;     color: inherit !important;     text-decoration: none !important;     font-size: inherit !important;     font-family: inherit !important;     font-weight: inherit !important;     line-height: inherit !important; } .a6S {     display: none !important;     opacity: 0.01 !important; } .im {     color: inherit !important; } img.g-img + div {     display: none !important; } @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {     u ~ div .email-container {         min-width: 320px !important;     } } @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {     u ~ div .email-container {         min-width: 375px !important;     } } @media only screen and (min-device-width: 414px) {     u ~ div .email-container {         min-width: 414px !important;     } }     </style>     <style> 	    .primary{ 	background: #30e3ca; } .bg_white{ 	background: #ffffff; } .bg_light{ 	background: #fafafa; } .bg_black{ 	background: #000000; } .bg_dark{ 	background: rgba(0,0,0,.8); } .email-section{ 	padding:2.5em; } .btn{ 	padding: 10px 15px; 	display: inline-block; } .btn.btn-primary{ 	border-radius: 5px; 	background: #30e3ca; 	color: #ffffff; } .btn.btn-white{ 	border-radius: 5px; 	background: #ffffff; 	color: #000000; } .btn.btn-white-outline{ 	border-radius: 5px; 	background: transparent; 	border: 1px solid #fff; 	color: #fff; } .btn.btn-black-outline{ 	border-radius: 0px; 	background: transparent; 	border: 2px solid #000; 	color: #000; 	font-weight: 700; } h1,h2,h3,h4,h5,h6{ 	font-family: "verdana", sans-serif; 	color: #000000; 	margin-top: 0; 	font-weight: 400; } body{ 	font-family: "verdana", sans-serif; 	font-weight: 400; 	font-size: 15px; 	line-height: 1.8; 	color: rgba(0,0,0,.4); } a{ 	color: #30e3ca; } table{ } .logo h1{ 	margin: 0; } .logo h1 a{ 	color: #30e3ca; 	font-size: 24px; 	font-weight: 700; 	font-family: "verdana", sans-serif; } .hero{ 	position: relative; 	z-index: 0; } .hero .text{ 	color: rgba(0,0,0,.3); } .hero .text h2{ 	color: #000; 	font-size: 40px; 	margin-bottom: 0; 	font-weight: 400; 	line-height: 1.4; } .hero .text h3{ 	font-size: 24px; 	font-weight: 300; } .hero .text h2 span{ 	font-weight: 600; 	color: #30e3ca; } .heading-section{ } .heading-section h2{ 	color: #000000; 	font-size: 28px; 	margin-top: 0; 	line-height: 1.4; 	font-weight: 400; } .heading-section .subheading{ 	margin-bottom: 20px !important; 	display: inline-block; 	font-size: 13px; 	text-transform: uppercase; 	letter-spacing: 2px; 	color: rgba(0,0,0,.4); 	position: relative; } .heading-section .subheading::after{ 	position: absolute; 	left: 0; 	right: 0; 	bottom: -10px; 	width: 100%; 	height: 2px; 	background: #30e3ca; 	margin: 0 auto; } .heading-section-white{ 	color: rgba(255,255,255,.8); } .heading-section-white h2{ 	font-family: 	line-height: 1; 	padding-bottom: 0; } .heading-section-white h2{ 	color: #ffffff; } .heading-section-white .subheading{ 	margin-bottom: 0; 	display: inline-block; 	font-size: 13px; 	text-transform: uppercase; 	letter-spacing: 2px; 	color: rgba(255,255,255,.4); } ul.social{ 	padding: 0; } ul.social li{ 	display: inline-block; 	margin-right: 10px; } .footer{ 	border-top: 1px solid rgba(0,0,0,.05); 	color: rgba(0,0,0,.5); } .footer .heading{ 	color: #000; 	font-size: 20px; } .footer ul{ 	margin: 0; 	padding: 0; } .footer ul li{ 	list-style: none; 	margin-bottom: 10px; } .footer ul li a{ 	color: rgba(0,0,0,1); } @media screen and (max-width: 500px) { }     </style> </head> <body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f1f1f1;"> 	<center style="width: 100%; background-color: #f1f1f1;">     <div style="display: none; font-size: 1px;max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">       &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;     </div>     <div style="max-width: 600px; margin: 0 auto;" class="email-container">       <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto;">       	<tr>           <td valign="top" class="bg_white" style="padding: 1em 2.5em 0 2.5em;">           	<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">           	</table>           </td> 	      </tr> 	      <tr>           <td valign="middle" class="hero bg_white" style="padding: 3em 0 2em 0;">             <img src="https://class.thestreamboard.com/boards/tools/svg/logo-final.png" alt="" style="width: 300px; height: auto; margin: auto; display: block;">           </td> 	      </tr> 				<tr>           <td valign="middle" class="hero bg_white">             <table>             	<tr>             		<td>             			<div class="text" style="padding: 0 2.5em; text-align: center;"> 						<h3>Hi ' +
          studentData.username +
          ',</h3>             				<h3>Registration Successfull  </h3>             				<h4>Please click the button below and create your own password.</h4>             				<p><a href="https://admin.thestreamboard.com/#/pages/authentication/reset-password-v2?id=' +
          studentData.userId +
          '" class="btn btn-primary">Create Password</a></p>             			</div>             		</td>             	</tr>             </table>           </td> 	      </tr>       </table>     </div>   </center> </body> </html>';

        console.log("studentData : " + studentData);
        let userResponse = {};
        if (email) {
          console.log("Sending password reset email  : " + email);
          mailer(email, template);

          const createMasterData = {};
          createMasterData.userId = studentData.userId;
          createMasterData.email = studentData.email;
          createMasterData.role = "Student";
          await MasterModel.create(createMasterData);
          const activity = await ActivityModel.create({ user: studentData._id, activityType: 'signup', info: { type: 'web', role: 'Student' } });
          console.log("AuthController:: register:: activity:: signup");
          userResponse = {
            userId: studentData.userId,
            username: studentData.firstName + " " + studentData.lastName,
            email: studentData.email,
            otp: otp,
          };
        }

        console.log("Sending response to user");
        // return successResponseWithData(
        //   res,
        //   AuthConstants.registrationSuccessMsg,
        //   userResponse
        // );
        resolve({ message: AuthConstants.registrationSuccessMsg, email: student.email });
      } catch (err) {
        console.log(err);
        if (err.code === 11000) {
          let str = "";
          Object.keys(err.keyPattern).forEach((d) => {
            str += `${d}, `;
          });
          str = str.slice(0, str.length - 2);
          resolve({
            type: 'error', message: str + " already taken",
            data: [{
              email: student.email
            }]
          });
          // return unauthorizedResponse(res, str + " already taken");
        }
      }
    }

  });
};

/**
 * Verify Confirm otp.
 * @param {string}      mobile
 * @param {string}      otp
 * @returns {Object}
 */
const verifyConfirm = [
  body("identity")
    .isString()
    .trim()
    .withMessage(AuthConstants.emailOrMobileReq)
    .escape(),
  body("otp")
    .isLength({
      min: 4,
    })
    .trim()
    .withMessage(AuthConstants.otpValidationError)
    .escape(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorWithData(
          res,
          AuthConstants.validationError,
          errors.array()
        );
      } else {
        const { identity } = req.body;

        // Regular expression to check if identity is email or not
        const re =
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const isEmail = re.test(String(identity).toLowerCase());
        let userData = {};
        let identityInDB = {};
        let identityInDBValue = {};

        if (isEmail) {
          console.log("User has provided email : " + identity);
          userData = await UserModel.findOne({
            email: identity,
          });
        } else {
          console.log("User has provided : " + identity);
          userData = await UserModel.findOne({
            $or: [{ username: identity }, { mobile: identity }],
          });
        }

        if (!userData) {
          console.log("User not found");
          return notFoundResponse(res, AuthConstants.userNotFound);
        }

        if (userData.mobile != undefined) {
          identityInDB = "mobile";
          identityInDBValue = userData.mobile;
        }
        if (userData.email != undefined) {
          identityInDB = "email";
          identityInDBValue = userData.email;
        }

        if (userData.confirmOTP == req.body.otp) {
          console.log("User provided OTP matched ");
          console.log("Preparing JWT Payload");
          let userResponse = {
            _id: userData._id,
            identityInDB: identityInDBValue,
          };
          //Prepare JWT token for authentication
          const jwtPayload = userResponse;

          console.log("Setting expiry time for JWT");
          const jwtData = {
            expiresIn: process.env.JWT_TIMEOUT_DURATION,
          };
          const secret = process.env.JWT_SECRET;
          //Generated JWT token with Payload and secret.
          console.log("Generating JWT");
          userResponse.token = jwt.sign(jwtPayload, secret, jwtData);
          userResponse.refreshToken = crypto.randomBytes(40).toString("hex");
          const refreshToken = new RefreshToken({
            user: userData._id,
            token: userResponse.refreshToken,
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdByIp: req.headers.IPV_Address,
          });
          console.log("Saving refresh token in DB");
          refreshToken.save();

          console.log("setting user is verified in DB");
          userData.confirmOTP = null;
          userData.isConfirmed = true;

          console.log("Saving user in DB and sending response to user");
          userData.save().then(() => {
            return successResponseWithData(
              res,
              AuthConstants.loginSuccessMsg,
              userResponse
            );
          });
        } else {
          console.log("OTP not matched");
          return ErrorResponse(res, AuthConstants.otpNotMatchMsg);
        }
      }
    } catch (err) {
      console.log(err);
      return ErrorResponse(res, err);
    }
  },
];

/**
 * Request new JWT Token with refresh token
 * @param {string} refreshToken
 */
const refreshToken = [
  body("refreshToken")
    .isString()
    .escape()
    .trim()
    .withMessage(AuthConstants.refreshTokenErrorMsg),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorWithData(
        res,
        AuthConstants.validationError,
        errors.array()
      );
    } else {
      try {
        const token = req.body.refreshToken;
        //check for refresh token validity
        const refreshToken = await RefreshToken.findOne({
          token,
        }).populate("user");

        if (!refreshToken || !refreshToken.isActive)
          return validationError(res, AuthConstants.invalidTokenMsg);
        const { user } = refreshToken;
        //generate new refresh token
        const newRefreshToken = new RefreshToken({
          user: user._id,
          token: crypto.randomBytes(40).toString("hex"),
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdByIp: req.headers.ipv_address,
        });
        refreshToken.revoked = Date.now();
        refreshToken.revokedByIp = req.headers.ipv_address;
        await refreshToken.save();
        await newRefreshToken.save();

        let userData = {
          _id: user._id,
          mobile: user.mobile,
        };

        //Prepare JWT token
        const jwtPayload = userData;
        const jwtData = {
          expiresIn: process.env.JWT_TIMEOUT_DURATION,
        };

        const secret = process.env.JWT_SECRET;
        const data = {
          token: jwt.sign(jwtPayload, secret, jwtData),
          refreshToken: newRefreshToken.token,
        };

        return successResponseWithData(res, AuthConstants.newTokenMsg, data);
      } catch (err) {
        return validationErrorWithData(res, AuthConstants.errorOccurred, err);
      }
    }
  },
];

/**
 * Resend Confirm otp.
 * @param {string}      mobile
 * @returns {Object}
 */
const resendConfirmOtp = [
  body("identity")
    .isString()
    .trim()
    .withMessage(AuthConstants.loginIdentityRequired)
    .escape(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation error in Resend OTP");
        return validationErrorWithData(
          res,
          AuthConstants.validationError,
          errors.array()
        );
      } else {
        const identity = req.body.identity;
        // Regular expression to check if identity is email or not
        const re =
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const isEmail = re.test(String(identity).toLowerCase());

        let userData = {};

        if (isEmail) {
          console.log("User provided email");
          userData = await UserModel.findOne({
            email: identity,
          });
        } else {
          console.log("User provided mobile or username");
          userData = await UserModel.findOne({
            $or: [{ username: identity }, { mobile: identity }],
          });
        }

        if (!userData) {
          // Not Found (404) If user is not found in the DB
          console.log("User not found");
          return notFoundResponse(res, AuthConstants.userNotFound);
        }

        console.log("userData : " + userData);

        // Generate OTP
        const otp = utility.randomNumber(6);

        let identityInDB;
        let identityInDBValue;

        // If user registered with mobile number then send OTP to it
        if (userData.mobile != undefined) {
          console.log("Sending OTP to user mobile : " + userData.mobile);
          identityInDB = "mobile";
          identityInDBValue = userData.mobile;
          const message = `<#> ${otp} ` + AuthConstants.otpMessage;
          //  await AWS_SNS.sendSMS(message, userData.countryCode + userData.mobile);
        }

        // If user registered with email then send OTP to it
        if (userData.email != undefined) {
          console.log("Sending OTP to user email : " + userData.email);
          identityInDB = "email";
          identityInDBValue = userData.email;
          mailer(identityInDBValue, otp);
        }

        console.log("identityInDB : " + identityInDB);
        console.log("identityInDBValue : " + identityInDBValue);

        console.log("Updating OTP for the user in DB");
        userData.confirmOTP = otp;
        await userData
          .save()
          .then(() => {
            console.log("Sending response to user");
            return successResponse(
              res,
              AuthConstants.confirmOtpSentMsg + " to " + identityInDBValue
            );
          })
          .catch((err) => {
            console.log("Error : " + err);
          });
      }
    } catch (err) {
      console.error("Error occurred in Resend OTP : " + err);
      return ErrorResponse(res, err);
    }
  },
];

/**
 * Check if Username is available or not
 * @param {string}      username
 * @returns {Object}
 */
const checkUsername = [
  body("username")
    .trim()
    .isString()
    .escape()
    .withMessage(AuthConstants.usernameRequired),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationErrorWithData(
          res,
          AuthConstants.validationError,
          errors.array()
        );
      } else {
        const { username } = req.params;
        const userData = await UserModel.findOne({ username });
        if (!userData) {
          return successResponseWithData(res, AuthConstants.usernameAvailable, {
            isTaken: false,
          });
        }
        return ErrorResponseWithData(res, AuthConstants.usernameNotAvailable, {
          isTaken: true,
        });
      }
    } catch (err) {
      return ErrorResponse(res, err);
    }
  },
];

/**
 * Function to Reset User Password
 */
const resetPassword = [
  body("identity")
    .isString()
    .trim()
    .withMessage(AuthConstants.loginIdentityRequired)
    .escape(),
  body("password")
    .isString()
    .trim()
    .withMessage(AuthConstants.passwordRequired)
    .escape(),
  body("confirmPassword")
    .isString()
    .trim()
    .withMessage(AuthConstants.confirmPasswordRequired)
    .escape(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation error in Reset Password");
        return validationErrorWithData(
          res,
          AuthConstants.validationError,
          errors.array()
        );
      } else {
        const { identity, password, confirmPassword } = req.body;

        // Regular expression to check if identity is email or not
        const re =
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const isEmail = re.test(String(identity).toLowerCase());
        let userData = {};

        if (isEmail) {
          console.log("user has provided email : " + identity);
          userData = await UserModel.findOne({
            email: identity,
          });
        } else {
          console.log("user has provided mobile : " + identity);
          userData = await UserModel.findOne({
            $or: [{ username: identity }, { mobile: identity }],
          });
        }

        if (!userData) {
          // Not Found (404) If user is not found in the DB
          console.log("User : " + identity + " is not found");
          return notFoundResponse(res, AuthConstants.userNotFound);
        }

        if (password != confirmPassword) {
          console.log("Password and confirm password did not match");
          return ErrorResponse(
            res,
            AuthConstants.passwordAndConfirmPasswordNotMatched
          );
        }

        const hashPassword = await bcrypt.hash(password, 10);
        userData.password = hashPassword;

        await userData
          .save()
          .then(() => {
            console.log("User Password updated successfully !");
            return successResponse(
              res,
              AuthConstants.resetPasswordSuccessful + " for " + identity
            );
          })
          .catch((err) => {
            console.log(AuthConstants.internalServerError + " : " + err);
            return internalServerError(res, AuthConstants.internalServerError);
          });
      }
    } catch (err) {
      console.log(AuthConstants.internalServerError + " : " + err);
      return internalServerError(res, AuthConstants.internalServerError);
    }
  },
];

export default {
  login,
  socialLogin,
  qrlogin,
  qrlogout,
  qrSessionStatus,
  register,
  verifyConfirm,
  refreshToken,
  resendConfirmOtp,
  checkUsername,
  resetPassword,
  registerTeacher,
  registerStudent,
  UniversalRegister,
  bulkRegisterStudent,
  bulkRegisterTeacher
};
