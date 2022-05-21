import UserModel from "../model/UserModel.js";

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

import validator from "express-validator";

const { body, validationResult } = validator;

/**
 * @description User Constants
 * @param UserConstants
 */
import { UserConstants } from "../const.js";

import UserReferrals from "../model/UserReferrals.js";
import TeacherModel from "../model/TeacherModel.js";
import StudentModel from "../model/StudentModel.js";

/**
 *  Get Referral Message with referral code
 *  @param {string} auth
 *  @param  {object} user
 *
 */
const sendReferral = async (req, res) => {
  //generate user invitation
  const inviteMessage = `Here is your joining bonus Rs.500, a welcome gift from your friend ${
    req.user.fullName ? req.user.fullName : "Secret Friend"
  }. Use code  ${req.user.referral_code} to avail the offer. Download Link: `;
  //fetch referral code from user data
  const data = {
    referral_code: req.user.referral_code,
    invitation: inviteMessage,
  };
  //send the response
  return successResponseWithData(res, UserConstants.referralCodeFetchMsg, data);
};
/**
 * Fetch user referrals
 *  @param {string} auth
 *  @param {object} user
 */
const fetchReferrals = async (req, res) => {
  try {
    //get list of referrals for the user
    const referrals = await UserReferrals.find({
      user: req.user._id,
    })
      .populate("referral")
      .exec();
    //create response and send data
    return successResponseWithData(
      res,
      UserConstants.userReferralMsg,
      referrals
    );
  } catch (e) {
    return validationErrorWithData(res, UserConstants.errorOccurred, e);
  }
};
/**
 * Get Profile
 */
const getProfile = async (req, res) => {
  if (req.user) {
    const user = {
      ...req.user._doc,
    };
    return successResponseWithData(
      res,
      UserConstants.profileFetchedSuccessMsg,
      user
    );
  } else {
    return ErrorResponse(res, UserConstants.NoUserFoundMsg);
  }
};

/**
 * Update profile
 */
const updateProfile = async (req, res) => {
  try {
    if (req.files) {
      userData = req.body;
      userData.profile_pic = req.files.profile_pic[0].location;
    } else {
      const { email, mobile, username } = req.body;
      let { user } = req;

      // DOUBT - We need to verify before updating email
      // and phone
      if (email) {
        user.email = email;
      }
      if (mobile) {
        user.mobile = mobile;
      }
      if (username) {
        user.username = username;
        user.user_name_changes = users.user_name_changes + 1;
      }

      await user.save();

      return successResponse(res, UserConstants.profileUpdateSuccessMsg);
    }
  } catch (err) {
    console.log(err);
    return ErrorResponse(res, UserConstants.profileUpdateError);
  }
};


const updateUser = async (req, res) => {
  try {
    const { classId,userId } = req.body;

    UserModel.updateOne({userId:userId},{classId: classId},
      (err, user) => {
        console.log(user);
        return ErrorResponse(res, UserConstants.profileUpdateError);
      //handle error
      });
     return successResponse(res, UserConstants.profileUpdateSuccessMsg);

  } catch (err) {
    console.log(err);
    return ErrorResponse(res, UserConstants.profileUpdateError);
  }
};

/**
 * Get all Users
 */
const allusers = async (req, res) => {
  try {
    // let users = await UserModel.find().exec();
    let users = await UserModel.aggregate([
      {
        $lookup:
        {
          from: 'users',
          localField: 'classId',
          foreignField: 'userId',
          as: 'class'
        }
      }
    ]);
    
    return successResponseWithData(
      res,
      UserConstants.userFetchedSuccessfully,
      users
    );
  } catch (e) {
    return validationErrorWithData(res, UserConstants.errorOccurred, e);
  }
};

/**
 * Get all Teachers
 */
const allTeachers = async (req, res) => {
  try {
    // let users = await UserModel.find().exec();
    let users = await TeacherModel.aggregate([
      {
        $lookup:
        {
          from: 'users',
          localField: 'classId',
          foreignField: 'userId',
          as: 'class'
        }
      }
    ]);
    
    return successResponseWithData(
      res,
      UserConstants.userFetchedSuccessfully,
      users
    );
  } catch (e) {
    return validationErrorWithData(res, UserConstants.errorOccurred, e);
  }
};

/**
 * Get all Students
 */
const allStudents = async (req, res) => {
  try {
    // let users = await UserModel.find().exec();
    let users = await StudentModel.aggregate([
      {
        $lookup:
        {
          from: 'users',
          localField: 'classId',
          foreignField: 'userId',
          as: 'class'
        }
      }
    ]);
    
    return successResponseWithData(
      res,
      UserConstants.userFetchedSuccessfully,
      users
    );
  } catch (e) {
    return validationErrorWithData(res, UserConstants.errorOccurred, e);
  }
};

const allusersRole = async (req, res) => {
  try {
    const { role } = req.params;
    let users;
   users = await UserModel.find({
        role
      }).exec();
    return successResponseWithData(
      res,
      UserConstants.userFetchedSuccessfully,
      users
    );
  } catch (e) {
    return validationErrorWithData(res, UserConstants.errorOccurred, e);
  }
};


/**
 *  Delete user
 *  @param {string} userId
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Add a boolean

    await UserModel.findByIdAndDelete(id);
    return successResponse(res, UserConstants.userDeletedSuccessfully);
  } catch (err) {
    console.log(err);
    return ErrorResponse(res, UserConstants.errorOccurred);
  }
};
export default {
  sendReferral,
  fetchReferrals,
  getProfile,
  allusers,
  updateProfile,
  deleteUser,
  allusersRole,
  updateUser,
  allTeachers,
  allStudents
};
