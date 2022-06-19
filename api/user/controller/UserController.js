import UserModel from "../model/UserModel.js";
import bcrypt from "bcryptjs";
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
import ClassModel from "../model/ClassModel.js";
import CalendarModel from "../model/CalendarModel.js";

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

const updateProfileData = async (req, res) => {
  try {
   
      const {
        organisation,
        fullName,
        firstName,
        lastName,
        address,
        mobile,
        userId
      } = req.body;
     
    await UserModel.updateMany({
      userId: userId
    },{
      
      address: address,
      lastName: lastName,
      firstName: firstName,
      fullName: fullName,
      mobile: mobile,
      organisation: organisation
    });

      return successResponse(res, UserConstants.profileUpdateSuccessMsg);
    
  } catch (err) {
    console.log(err);
    return ErrorResponse(res, UserConstants.profileUpdateError);
  }
};

const updateThidPartyFeatures = async (req, res) => {
  try {

    const {
      isGoogleDriveEnable,
      isOneDriveEnable,
      isImmersiveReaderEnable,
      isMagicDrawEnable,
      isHandWritingEnable,
      isPhetEnable,
      userId
    } = req.body;

    await UserModel.updateMany({
      userId: userId
    }, {

      isGoogleDriveEnable: isGoogleDriveEnable,
      isOneDriveEnable: isOneDriveEnable,
      isImmersiveReaderEnable: isImmersiveReaderEnable,
      isMagicDrawEnable: isMagicDrawEnable,
      isHandWritingEnable: isHandWritingEnable,
      isPhetEnable: isPhetEnable
    });

    return successResponse(res, UserConstants.profileUpdateSuccessMsg);

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

const updateUserStatus = async (req, res) => {
  try {
    const { isActive,userId, status } = req.body;
    console.log(isActive);
    console.log(userId);
    console.log(status);

    await UserModel.updateOne({userId: userId}, {isActive: isActive});
     await UserModel.updateOne({ userId: userId },{ status: status });
     return successResponse(res, UserConstants.profileUpdateSuccessMsg);

  } catch (err) {
    console.log(err);
    return ErrorResponse(res, UserConstants.profileUpdateError);
  }
};

const updateTeacherStatus = async (req, res) => {
  try {
    const {
      isActive,
      userId,
      status
    } = req.body;
    console.log(isActive);
    console.log(userId);
    console.log(status);

    await TeacherModel.updateOne({
      userId: userId
    }, {
      isActive: isActive
    });
    await TeacherModel.updateOne({
      userId: userId
    }, {
      status: status
    });
    return successResponse(res, UserConstants.profileUpdateSuccessMsg);

  } catch (err) {
    console.log(err);
    return ErrorResponse(res, UserConstants.profileUpdateError);
  }
};

const updateStudentStatus = async (req, res) => {
  try {
    const {
      isActive,
      userId,
      status
    } = req.body;
    console.log(isActive);
    console.log(userId);
    console.log(status);

    await StudentModel.updateOne({
      userId: userId
    }, {
      isActive: isActive
    });
    await StudentModel.updateOne({
      userId: userId
    }, {
      status: status
    });
    return successResponse(res, UserConstants.profileUpdateSuccessMsg);

  } catch (err) {
    console.log(err);
    return ErrorResponse(res, UserConstants.profileUpdateError);
  }
};

const updateUserPassword = async (req, res) => {
  try {
    const { userId, password } = req.body;

    const hashPass = await bcrypt.hash(password, 10);
    console.log(hashPass);
     await UserModel.updateOne({userId:userId},{password:hashPass});
    // UserModel.updateOne({userId:userId},{password:hashPass},
    //   (err, user) => {
    //             console.log(err);
    //     console.log(user);
    //     return ErrorResponse(res, UserConstants.profileUpdateError);
    //   //handle error
    //   });
     return successResponse(res, UserConstants.profileUpdateSuccessMsg);

  } catch (err) {
    console.log(err);
    return ErrorResponse(res, UserConstants.profileUpdateError);
  }
};

const sendInvitation = async (req, res) => {
  try {
    const { emailId } = req.body;
    console.log('invite:', emailId);
    const template = '<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>    <meta charset="utf-8"> <meta name="viewport" content="width=device-width">     <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="x-apple-disable-message-reformatting">      <title></title> <link href="https://fonts.googleapis.com/css?family=verdana:300,400,700" rel="stylesheet">    <style> html,body {    margin: 0 auto !important;padding: 0 !important;height: 100% !important;width: 100% !important;background: #f1f1f1;}* {-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;}div[style*="margin: 16px 0"] {margin: 0 !important;}table,td {    mso-table-lspace: 0pt !important;    mso-table-rspace: 0pt !important;}table {    border-spacing: 0 !important;    border-collapse: collapse !important;    table-layout: fixed !important;    margin: 0 auto !important;}img {    -ms-interpolation-mode:bicubic;}a {    text-decoration: none;}*[x-apple-data-detectors],  .unstyle-auto-detected-links *,.aBn {    border-bottom: 0 !important;    cursor: default !important;     color: inherit !important;     text-decoration: none !important;     font-size: inherit !important;     font-family: inherit !important;     font-weight: inherit !important;     line-height: inherit !important; } .a6S {     display: none !important;     opacity: 0.01 !important; } .im {     color: inherit !important; } img.g-img + div {     display: none !important; } @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {     u ~ div .email-container {         min-width: 320px !important;     } } @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {     u ~ div .email-container {         min-width: 375px !important;     } } @media only screen and (min-device-width: 414px) {     u ~ div .email-container {         min-width: 414px !important;     } }     </style>     <style> 	    .primary{ 	background: #30e3ca; } .bg_white{ 	background: #ffffff; } .bg_light{ 	background: #fafafa; } .bg_black{ 	background: #000000; } .bg_dark{ 	background: rgba(0,0,0,.8); } .email-section{ 	padding:2.5em; } .btn{ 	padding: 10px 15px; 	display: inline-block; } .btn.btn-primary{ 	border-radius: 5px; 	background: #30e3ca; 	color: #ffffff; } .btn.btn-white{ 	border-radius: 5px; 	background: #ffffff; 	color: #000000; } .btn.btn-white-outline{ 	border-radius: 5px; 	background: transparent; 	border: 1px solid #fff; 	color: #fff; } .btn.btn-black-outline{ 	border-radius: 0px; 	background: transparent; 	border: 2px solid #000; 	color: #000; 	font-weight: 700; } h1,h2,h3,h4,h5,h6{ 	font-family: "verdana", sans-serif; 	color: #000000; 	margin-top: 0; 	font-weight: 400; } body{ 	font-family: "verdana", sans-serif; 	font-weight: 400; 	font-size: 15px; 	line-height: 1.8; 	color: rgba(0,0,0,.4); } a{ 	color: #30e3ca; } table{ } .logo h1{ 	margin: 0; } .logo h1 a{ 	color: #30e3ca; 	font-size: 24px; 	font-weight: 700; 	font-family: "verdana", sans-serif; } .hero{ 	position: relative; 	z-index: 0; } .hero .text{ 	color: rgba(0,0,0,.3); } .hero .text h2{ 	color: #000; 	font-size: 40px; 	margin-bottom: 0; 	font-weight: 400; 	line-height: 1.4; } .hero .text h3{ 	font-size: 24px; 	font-weight: 300; } .hero .text h2 span{ 	font-weight: 600; 	color: #30e3ca; } .heading-section{ } .heading-section h2{ 	color: #000000; 	font-size: 28px; 	margin-top: 0; 	line-height: 1.4; 	font-weight: 400; } .heading-section .subheading{ 	margin-bottom: 20px !important; 	display: inline-block; 	font-size: 13px; 	text-transform: uppercase; 	letter-spacing: 2px; 	color: rgba(0,0,0,.4); 	position: relative; } .heading-section .subheading::after{ 	position: absolute; 	left: 0; 	right: 0; 	bottom: -10px; 	width: 100%; 	height: 2px; 	background: #30e3ca; 	margin: 0 auto; } .heading-section-white{ 	color: rgba(255,255,255,.8); } .heading-section-white h2{ 	font-family: 	line-height: 1; 	padding-bottom: 0; } .heading-section-white h2{ 	color: #ffffff; } .heading-section-white .subheading{ 	margin-bottom: 0; 	display: inline-block; 	font-size: 13px; 	text-transform: uppercase; 	letter-spacing: 2px; 	color: rgba(255,255,255,.4); } ul.social{ 	padding: 0; } ul.social li{ 	display: inline-block; 	margin-right: 10px; } .footer{ 	border-top: 1px solid rgba(0,0,0,.05); 	color: rgba(0,0,0,.5); } .footer .heading{ 	color: #000; 	font-size: 20px; } .footer ul{ 	margin: 0; 	padding: 0; } .footer ul li{ 	list-style: none; 	margin-bottom: 10px; } .footer ul li a{ 	color: rgba(0,0,0,1); } @media screen and (max-width: 500px) { }     </style> </head> <body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f1f1f1;"> 	<center style="width: 100%; background-color: #f1f1f1;">     <div style="display: none; font-size: 1px;max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">       &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;     </div>     <div style="max-width: 600px; margin: 0 auto;" class="email-container">       <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto;">       	<tr>           <td valign="top" class="bg_white" style="padding: 1em 2.5em 0 2.5em;">           	<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">           	</table>           </td> 	      </tr> 	      <tr>           <td valign="middle" class="hero bg_white" style="padding: 3em 0 2em 0;">             <img src="http://65.108.95.12:50021/boards/tools/svg/logo-final.png" alt="" style="width: 300px; height: auto; margin: auto; display: block;">           </td> 	      </tr> 				<tr>           <td valign="middle" class="hero bg_white">             <table>             	<tr>             		<td>             			<div class="text" style="padding: 0 2.5em; text-align: center;"> 						<h3>Hi,</h3>             				<h3>Invitation to Join StreamBoard Entity  </h3>             				<h4>Please click the REGISTER button below and join with us.</h4>             				<p><a href="http://65.108.95.12:9000/pages/authentication/school-register" class="btn btn-primary">Register</a></p>             			</div>             		</td>             	</tr>             </table>           </td> 	      </tr>       </table>     </div>   </center> </body> </html>';

    mailer(emailId, template);
     return successResponse(res, "success");
  } catch (err) {
    console.log(err);
    return ErrorResponse(res,"error");
  }
};

const createClass = async (req, res) => {
  try {

    const {
     className,
     schoolId
    } = req.body;
    const createData = {
      className,
      schoolId
    };
    createData.className = className;
    createData.schoolId = schoolId;
    

    await ClassModel.create(createData);
    return successResponse(
      res,
      UserConstants.createdSuccess,
    );
  } catch (err) {
    console.log(err);
    return validationErrorWithData(res, UserConstants.errorOccurred, err);
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
    const {
      schoolId
    } = req.params;
    console.log(schoolId);
    // let users = await UserModel.find().exec();
    let users = await TeacherModel.aggregate([
      {
        $match: {
          schoolId: schoolId
        }
      },
      {
        $lookup:
        {
          from: 'users',
          localField: 'classId',
          foreignField: 'userId',
          as: 'class'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'schoolId',
          foreignField: 'userId',
          as: 'school'
        }
      }
    ]);
    console.log(users);
    return successResponseWithData(
      res,
      UserConstants.userFetchedSuccessfully,
      users
    );
  } catch (e) {
    console.log(e);
    return validationErrorWithData(res, UserConstants.errorOccurred, e);
  }
};

/**
 * Get all Students
 */
const allStudents = async (req, res) => {
  try {
    const {
      schoolId
    } = req.params;
    console.log(schoolId);
    // let users = await UserModel.find().exec();
    let users = await StudentModel.aggregate([
      {
        $match: {
          schoolId: schoolId
        }
      },
      {
        $lookup:
        {
          from: 'users',
          localField: 'classId',
          foreignField: 'userId',
          as: 'class'
        }
      },
       {
         $lookup: {
           from: 'users',
           localField: 'schoolId',
           foreignField: 'userId',
           as: 'school'
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
const allClasses = async (req, res) => {
  try {
    const {
      schoolId
    } = req.params;
    let users;
    users = await ClassModel.find({
      schoolId: schoolId
    });

    return successResponseWithData(
      res,
      UserConstants.userFetchedSuccessfully,
      users
    );
  } catch (e) {
    console.log(e);
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

const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    // Add a boolean

    await TeacherModel.findByIdAndDelete(id);
    return successResponse(res, UserConstants.userDeletedSuccessfully);
  } catch (err) {
    console.log(err);
    return ErrorResponse(res, UserConstants.errorOccurred);
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    // Add a boolean

    await StudentModel.findByIdAndDelete(id);
    return successResponse(res, UserConstants.userDeletedSuccessfully);
  } catch (err) {
    console.log(err);
    return ErrorResponse(res, UserConstants.errorOccurred);
  }
};

const getCounts = async (req, res) => {
  try {
    console.log(req.params);
    const { userid } = req.params;
        console.log(userid);

    var usersRole = await UserModel.findOne({
      userId: userid
    });
    console.log(usersRole);
    var students = await StudentModel.find({
      schoolId: userid
    }).count();
    var studentsActive = await StudentModel.find({
      schoolId: userid,
      status: 'active'
    }).count();
    var studentsInActive = await StudentModel.find({
      schoolId: userid,
      status: 'inactive'
    }).count();
    // var teachers = await TeacherModel.count();
    var admin = await UserModel.find({
      role: 'Admin',
    }).count();
    var teachers = await TeacherModel.find({
      schoolId: userid
    }).count();
    var teachersActive = await TeacherModel.find({
      schoolId: userid,
      status: 'active'
    }).count();
    var teachersInActive = await TeacherModel.find({
      schoolId: userid,
      status: 'inactive'
    }).count();

    var schools = await UserModel.find({
      role: 'School',
    }).count();
    var schoolsActive = await UserModel.find({
      role: 'School',
      status: 'active'
    }).count();
    var schoolsInActive = await UserModel.find({
      role: 'School',
      status: 'inactive'
    }).count();
    var schoolsFree = await UserModel.find({
      role: 'School',
      plan: 'Free'
    }).count();
    var schoolsPaid = await UserModel.find({
      role: 'School',
      plan: 'paid'
    }).count();
    var individuals = await UserModel.find({
      role: 'Individual',
    }).count();
    var classCount = await ClassModel.find({
      schoolId: userid
    }).count();
    var usersC = await UserModel.count();
  
    const response = {
      studentsCount: students,
      teachersCount: teachers,
      usersCount: students + teachers,
      schoolsCount: schools,
      adminsCount: admin,
      individualsCount: individuals,
      role: usersRole.role,
      schoolsActiveCount: schoolsActive,
      schoolsInActiveCount: schoolsInActive,
      schoolsPaidCount: schoolsPaid,
      schoolsFreeCount: schoolsFree,
      teachersActiveCount: teachersActive,
      teachersInActiveCount: teachersInActive,
      studentsActiveCount: studentsActive,
      studentsInActiveCount: studentsInActive
    }
    // return successResponse(res, UserConstants.userDeletedSuccessfully);
     return successResponseWithData(
            res,
            UserConstants.successResponse,
            response
        );
  } catch (err) {
    console.log(err);
    return ErrorResponse(res, UserConstants.errorOccurred);
  }
};

const createCalendar = async (req, res) => {
  try {

    const {
      title,
      label,
      startDate,
      endDate,
      eventUrl,
      guests,
      description
    } = req.body;
    const createData = {};

    if (description) {
      createData.description = description;
    }

    createData.title = title;
    createData.calendar = label;
    createData.start = startDate;
    createData.end = endDate;
    createData.url = eventUrl;
    createData.guests = guests;

    await CalendarModel.create(createData);
    return successResponse(
      res,
      UserConstants.createdSuccess,
    );
  } catch (err) {
    console.log(err);
    return validationErrorWithData(res, UserConstants.errorOccurred, err);
  }
};

const allCalendar = async (req, res) => {
  try {
      const {
        title,
        label,
        startDate,
        endDate,
        eventUrl,
        guests,
        description
      } = req.params;
    
    let users = await CalendarModel.find().exec();

    return successResponseWithData(
      res,
      UserConstants.userFetchedSuccessfully,
      users
    );
  } catch (e) {
    return validationErrorWithData(res, UserConstants.errorOccurred, e);
  }
};

export default {
  sendReferral,
  fetchReferrals,
  getProfile,
  allusers,
  updateProfile,
  deleteUser,
  deleteTeacher,
  deleteStudent,
  allusersRole,
  updateUser,
  allTeachers,
  allStudents,
  updateUserPassword,
  sendInvitation,
  updateUserStatus,
  getCounts,
  updateProfileData,
  createClass,
  allClasses,
  updateTeacherStatus,
  updateStudentStatus,
  createCalendar,
  allCalendar,
  updateThidPartyFeatures
};
