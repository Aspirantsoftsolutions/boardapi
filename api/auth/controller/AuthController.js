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
      } 
      else {
        const { identity, password } = req.body;

        // Regular expression to check if identity is email or not
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const isEmail = re.test(String(identity).toLowerCase());
        let userData = {} ;

        if(isEmail){
          console.log("user has provided email : "+identity);
          userData = await UserModel.findOne({
            email : identity
          });
        }
        else{
          console.log("user has provided mobile : "+identity);
          userData = await UserModel.findOne({
            $or: [
              { username: identity },
              { mobile: identity }
            ],
          });
        }

        if (!userData) {
          // Not Found (404) If user is not found in the DB
          console.log("User : "+identity + " is not found");
          return notFoundResponse(res, AuthConstants.userNotFound);
        }

        const isPassValid = await bcrypt.compare(password, userData.password);

        if (!isPassValid) {
          // Bad Request (400) as password is incorrect
          console.log("Wrong password provided for : "+identity);
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
          if(userData.mobile != undefined){
              identityInDB = "mobile";
              identityInDBValue = userData.mobile;
              const message = `<#> ${otp} ` + AuthConstants.otpMessage;
              // await AWS_SNS.sendSMS(message, userData.countryCode + userData.mobile);
              console.log("Sent OTP to "+ identityInDB + " : "+ identityInDBValue);
          }

          // If user registered with email then send OTP to it
          if(userData.email != undefined){
              identityInDB = "email";
              identityInDBValue = userData.email;
              mailer(identityInDBValue, otp);
              console.log("Sent OTP to "+ identityInDB + " : "+ identityInDBValue);
          }

         console.log("Updating user document in DB with new OTP");
          // Update OTP to the user document
          await UserModel.findOneAndUpdate(
              {
                identityInDB : identityInDBValue,
              },
              {
                $set : { confirmOTP: otp }
              }
          );
          
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

        const refreshToken = new RefreshToken({
          user: userData._id,
          token: jwtPayload.refreshToken,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdByIp: req.headers.IPV_Address,
        });
        console.log("Saving Refresh token in DB");
        refreshToken.save();

        console.log("returning successful response to user");
        return successResponseWithData(
            res,
            AuthConstants.loginSuccessMsg,
            jwtPayload
        );

      }
    } catch (err) {
      //throw error in json response with status 500.
      console.log("Error occurred in login : "+err);
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
      } 
      else {
        let identityProvided = false;
        let identityName ;
        let user;
        console.log(req.body.mobile);
        console.log(req.body.email);

        if(req.body.mobile != undefined){
          console.log("User provided mobile number");
          // check if country code is not empty
          if(req.body.countryCode != undefined) {
            let mobileNumber = req.body.countryCode + req.body.mobile;
            user = await UserModel.findOne(
              {
                mobile : mobileNumber
              }
            );
            identityProvided = true;
            identityName = "mobile";
          }
          else{
            return ErrorResponse(res,AuthConstants.countryCodeRequired);
          }
        }

        if(req.body.email != undefined){
          console.log("User provided email");
          user = await UserModel.findOne(
            {
              email : req.body.email
            }
          )
          identityProvided = true;
          identityName = "email";
        }
    
        console.log("----------------------");
        console.log(user);
        console.log("----------------------");

        if(identityProvided == false){
           return ErrorResponse(res,AuthConstants.emailOrMobileReq);
        }

        // User exists in DB
        if (user) {
          console.log("User already registered");
          return ErrorResponse(res,AuthConstants.alreadyRegistered + " with same "+identityName + ". " + AuthConstants.pleaseLogin);
        } 
        else {
          console.log("Registering user");
          const { email, password, username, mobile, countryCode } = req.body;
          const otp = utility.randomNumber(6);
          const hashPass = await bcrypt.hash(password, 10);

          const createData ={
            username,
            password:hashPass,
            confirmOTP:otp
          }

          if (!email && !mobile) {
            console.log("Both email and mobile number not provided");
            return ErrorResponse(res, AuthConstants.emailOrMobileReq);
          }
          if (mobile && !countryCode) {
            console.log("Country code not provided");
            return ErrorResponse(res, AuthConstants.countryCodeRequired);
          }

          if (!mobile && countryCode) {
            console.log("mobile number not provided");
            return ErrorResponse(res, AuthConstants.mobileNumRequired);
          }

          if(mobile && countryCode){
            console.log("mobile number and country code provided");
            createData.mobile = `${countryCode}${mobile}`
            createData.countryCode = countryCode
          }
          else if(email){
            console.log("email is provided");
            createData.email = email
          }
          else{
            console.log("Both email and mobile number are not provided");
            return ErrorResponse(res, AuthConstants.emailOrMobileReq);
          }

          console.log("createData : "+ createData.username);
          console.log(createData.email);
          console.log(createData.mobile);
          console.log(createData.countryCode);

          //const message = `<#> ${otp} ` + AuthConstants.otpMessage;
          //await AWS_SNS.sendSMS(message, countryCode+mobile);
          try {
            const userData = await UserModel.create(createData);

            console.log("userData : "+userData);
            let userResponse = {};
            if(email){
              console.log("Sending OTP to email : "+email);
              mailer(email, otp);
              userResponse = {
                  userId: userData.userId,
                  username: userData.username,
                  email: userData.email
              }
            }
            else if(mobile){
              console.log("Sending OTP to mobile number");
              const message = `<#> ${otp} ` + AuthConstants.otpMessage;
              //await AWS_SNS.sendSMS(message, countryCode+mobile);
              userResponse = {
                userId: userData.userId,
                username: userData.username,
                mobile: userData.mobile
              }
            }

            console.log("Sending response to user");
            return successResponseWithData(
              res,
              AuthConstants.registrationSuccessMsg,
              userResponse
            );
          } catch (err) {
            console.log(err)
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
      } 
      else {
        const { identity } = req.body;

        // Regular expression to check if identity is email or not
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const isEmail = re.test(String(identity).toLowerCase());
        let userData = {};
        let identityInDB = {};
        let identityInDBValue = {};

        if(isEmail){
          console.log("User has provided email : "+identity);
          userData = await UserModel.findOne({
            email : identity
          });
        }
        else{
          console.log("User has provided : "+identity);
          userData = await UserModel.findOne({
            $or: [
              { username: identity },
              { mobile: identity }
            ],
          });
        }

        if(!userData){
          console.log("User not found");
          return notFoundResponse(res,AuthConstants.userNotFound);
        }

        if(userData.mobile != undefined){
            identityInDB = "mobile";
            identityInDBValue = userData.mobile;
        }
        if(userData.email != undefined){
          identityInDB = "email";
          identityInDBValue = userData.email;
        }

        if(userData.confirmOTP == req.body.otp){
          console.log("User provided OTP matched ");
          console.log("Preparing JWT Payload");
          let userResponse = {
            _id : userData._id,
            identityInDB : identityInDBValue,
          }
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
          
        }
        else{
          console.log("OTP not matched");
          return ErrorResponse(res,AuthConstants.otpNotMatchMsg);
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
      } 
      else {
        const identity = req.body.identity;
        // Regular expression to check if identity is email or not
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const isEmail = re.test(String(identity).toLowerCase());

        let userData = {};
        
        if(isEmail){
          console.log("User provided email");
          userData = await UserModel.findOne({
            email : identity
          });
        }
        else{
          console.log("User provided mobile or username");
          userData = await UserModel.findOne({
            $or: [
              { username: identity },
              { mobile: identity }
            ],
          });
        }

        if (!userData) {
          // Not Found (404) If user is not found in the DB
          console.log("User not found");
          return notFoundResponse(res, AuthConstants.userNotFound);
        }

        console.log("userData : "+ userData);

         // Generate OTP
         const otp = utility.randomNumber(6);

         let identityInDB ;
         let identityInDBValue ;

         // If user registered with mobile number then send OTP to it
         if(userData.mobile != undefined){
             console.log("Sending OTP to user mobile : "+userData.mobile);
             identityInDB = "mobile";
             identityInDBValue = userData.mobile;
             const message = `<#> ${otp} ` + AuthConstants.otpMessage;
            //  await AWS_SNS.sendSMS(message, userData.countryCode + userData.mobile);
         }

         // If user registered with email then send OTP to it
         if(userData.email != undefined){
             console.log("Sending OTP to user email : "+userData.email);
             identityInDB = "email";
             identityInDBValue = userData.email;
             mailer(identityInDBValue, otp);
         }

         console.log("identityInDB : "+identityInDB);
         console.log("identityInDBValue : "+identityInDBValue);
        
         console.log("Updating OTP for the user in DB");
        userData.confirmOTP = otp;
        await userData.save()
        .then(() => {
            console.log("Sending response to user");
            return successResponse(res, AuthConstants.confirmOtpSentMsg + " to "+identityInDBValue);
        }).catch(err => {
            console.log("Error : "+err);
        });
       
      }
    } catch (err) {
      console.error("Error occurred in Resend OTP : "+err);
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
        return ErrorResponseWithData(
          res,
          AuthConstants.usernameNotAvailable,
          { isTaken: true }
        );
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
      }
      else{
        const { identity, password, confirmPassword } = req.body;

        // Regular expression to check if identity is email or not
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const isEmail = re.test(String(identity).toLowerCase());
        let userData = {} ;

        if(isEmail){
          console.log("user has provided email : "+identity);
          userData = await UserModel.findOne({
            email : identity
          });
        }
        else{
          console.log("user has provided mobile : "+identity);
          userData = await UserModel.findOne({
            $or: [
              { username: identity },
              { mobile: identity }
            ],
          });
        }

        if (!userData) {
          // Not Found (404) If user is not found in the DB
          console.log("User : "+identity + " is not found");
          return notFoundResponse(res, AuthConstants.userNotFound);
        }

        if(password != confirmPassword){
          console.log("Password and confirm password did not match");
          return ErrorResponse(res,AuthConstants.passwordAndConfirmPasswordNotMatched);
        }

        const hashPassword = await bcrypt.hash(password, 10);
        userData.password = hashPassword;

        await userData.save().then(()=>{
            console.log("User Password updated successfully !");
            return successResponse(res,AuthConstants.resetPasswordSuccessful + " for " + identity);
        }).catch((err)=>{
          console.log(AuthConstants.internalServerError + " : " + err);
          return internalServerError(res,AuthConstants.internalServerError);
        });

      } 
  }
  catch(err){
    console.log(AuthConstants.internalServerError + " : " + err);
    return internalServerError(res,AuthConstants.internalServerError);
  }
}
]

export default {
  login,
  register,
  verifyConfirm,
  refreshToken,
  resendConfirmOtp,
  checkUsername,
  resetPassword
};
