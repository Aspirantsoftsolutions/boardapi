const AuthConstants = {
  mobileNumRequired: "Mobile Number must be specified",
  countryCodeRequired: "Country Code must be specified",
  emailOrMobileReq: "Either email or mobile required",
  loginIdentityRequired:
    "Mobile number or email or Username either of them should be provided",
  userNotFound: "User not found",
  accountNotVerified: "Account is not verified. Please enter OTP to verify.",
  deviceIdentity: 'Device type is required',
  qrInfo: 'qr info is required',
  emailRequired: "Valid email must be specified",
  usernameRequired: "Username must be specified",
  shortId: "Short ID is required",
  passwordRequired: "Password must be specified",
  confirmPasswordRequired: "Confirm Password must be specified",
  passwordAndConfirmPasswordNotMatched: "Password and confirm password did not match",
  resetPasswordSuccessful: "Reset Password Successful",
  validationError: "Validation Error",
  otpValidationError: "OTP must be specified.",
  otpMessage:
    "is your OTP for Login. Do not share your OTP with anyone. Wo Team or its employees will never ask for OTP.",
  otpSuccessfullySent: "OTP successfully sent",
  promoCodeValidationError: "Please enter a valid Promo Code",
  loginSuccessMsg: "Loggedin Successfully",
  loginErrorMsg: "User is Inactive, please contact admin",
  registrationSuccessMsg: "Registered Successfully",
  alreadyRegistered: "User already registered",
  pleaseLogin: "Please Login !",
  accountActiveMsg: "email already taken",
  accountNotConfirmMsg:
    "Account is not confirmed. Please confirm your account.",
  emailPwdValidationMsg: "Email or Password wrong.",
  wrongPassword: "Wrong password",
  wrongOtpMsg: "Wrong OTP Provided",
  otpNotMatchMsg: "Incorrect OTP",
  mobileNotFoundMsg: "Specified mobile not found.",
  refreshTokenErrorMsg: "Provide Refresh Token",
  invalidTokenMsg: "Invalid Refresh Token",
  newTokenMsg: "New token issued successfully",
  errorOccurred: "Error Occured",
  confirmOtpSentMsg: "Resent OTP",
  accountConfirmMSg: "Account already confirmed.",
  usernameAvailable: "Username is not taken",
  usernameNotAvailable: "Username is taken",

  //Coupons Constants
  couponCreatedSuccessMsg: "Coupon created successfully",
  couponsFetchedSuccessMsg: "Coupons fetched successfully",
  couponDeleteSuccessMsg: "Coupon Deleted Succesfully",
  couponUpdateSuccessMsg: "Coupon updated successfully",

  internalServerError: "Internal Server Error"
};

export { AuthConstants };
