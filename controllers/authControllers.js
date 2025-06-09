const jwt = require("jsonwebtoken"),
  bcrypt = require("bcryptjs"),
  path = require("path"),

  { User } = require("../model/user"),
  { TravelRequest } = require("../model/TravelerRequest"),
  { SendEmail } = require("../services/sendEmailService"),
  { sendResponse } = require("../utils/sendResponse"),
  { isEmpty } = require("../utils/isEmpty"),
  { errorHandling } = require('../utils/errorhandling'),
  { STATUS_CODES, FIELDS } = require('../utils/constants'),
  { asyncHandler } = require('../middlewares/asyncHandler');

// Register User Controller
exports.registerUser = async (req, res) => {
  try {
    // check if any value in body is empty
    if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, FIELDS.FILL_ALL_FIELDS));
    const { email, password, confirmPassword } = req.body;

    if (await User.isEmailValid(email)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Invalid email format"));

    if (await User.isEmailTaken(email)) {
      if (await User.isEmailDeleted(email)) {
        return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "User Already Exist"));
      }
      return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "User Already Exist"));
    }

    // Validate password
    if (await User.isPasswordValid(password)) {
      if (password.length < 8) {
        return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Password Length Must be 8 or more"));
      }
      return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Invalid password format"));
    }

    if (password !== confirmPassword) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Password Does't Match with Confirm Password"));

    const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
    const hashPassword = await bcrypt.hash(password, salt);

    let user = await User.create({ ...req.body, password: hashPassword, confirmPassword: hashPassword });
    const token = user.generateAuthToken();
    const backend_url = process.env.BASE_URL || "https://flutterapi.testdevlink.net/lug-traveler/";

    // Base Url
    const url = `${backend_url}users/${user.id}/verify/${token}`;
    const data = { url: url, name: req.body.fullname };

    const targetDir = "/views/verify-email.ejs";
    const destination = path.join(__dirname, "../", targetDir);

    //Now send email to verify
    // await SendEmail(user.email, "Verify your Email Address", data, destination);

    // res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "An Email Send to Your Account, Please Verify"));
    res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Your account has been successfully created."));

  } catch (error) {
    errorHandling(error, res);
  }
}

// Email Verify Controller
exports.verifyEmail = async (req, res) => {
  try {
    const { id, token } = req.params;
    //Check if link is valid
    const user = await User.findOne({ _id: id });
    if (!user) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Invalid Link"));

    if (user.verified) {
      res.send(sendResponse(false, "User Already Verified"));
    } else {
      //check if the token is valid or not (decode returns the data of the user)
      const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY || 'my secret key');

      if (!decoded)
        return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Invalid Link"));

      await User.updateOne({ _id: user._id }, { verified: true });
      res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Email Verified Successfully"));
    }
  } catch (error) {
    errorHandling(error, res);
  }
}

// Login User Controller
exports.loginUser = asyncHandler(async (req, res) => {
  if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, FIELDS.FILL_ALL_FIELDS));
  const { email, password, fcmToken } = req.body;

  if (await User.isEmailValid(email)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Invalid email format"));

  let user = await User.findOne({ email: email }).select("+password");

  if (!user || user.isDeleted) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "User with this email doesn't Exist"));
  if (!user || !(await user.isPasswordMatch(password))) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Invalid Password"));
  if (user?.isBlocked) return res.status(STATUS_CODES.FORBIDDEN).send(sendResponse(false, `Your account is blocked because of ${user?.isBlockedReason}`));
  let userScore = await TravelRequest.find({ travelerId: user._id, isPaid: true }).countDocuments();

  let token;
  // if (!user.verified) {
  //   token = user.generateAuthToken();
  //   const backend_url = process.env.BASE_URL || "https://flutterapi.testdevlink.net/lug-traveler/";

  //   const url = `${backend_url}users/${user.id}/verify/${token}`;
  //   const data = { url: url, name: user.fullname };

  //   const targetDir = "/views/verify-email.ejs";
  //   const destination = path.join(__dirname, "../", targetDir);

  //   await SendEmail(user.email, "Verify your Email Address", data, destination);
  //   return res.status(STATUS_CODES.SUCCESS).send(sendResponse(false, "Your Account is not verified, An Email Send to Your Account, Please Verify & Try Again"));
  // }

  token = user.generateAuthToken();
  user = await User.findById(user.id);
  if (fcmToken) { user = await User.findByIdAndUpdate(user.id, { fcmToken: fcmToken }, { new: true }) }
  let results = { user: user, token: token, userScore };

  res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "logged in successfully", results));
});

// Logout User Controller
exports.logout = async (req, res) => {
  try {
    let user = await User.findByIdAndUpdate(req.user.id, { fcmToken: '' }, { new: true });
    res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "logged out successfully", user));

  } catch (error) {
    errorHandling(error, res);
  }
}

// Connect With Google (Sign Up & Sign In) Controller
exports.connectWithGoogle = async (req, res) => {
  try {
    // Google Sign Up And Sign In
    if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, FIELDS.FILL_ALL_FIELDS));

    const { displayName, email, photoURL, fcmToken } = req.body;
    let user = await User.findOne({ email: email });
    let data = {}, token;

    // If the user is deleted, and wanna register again
    if (user?.isDeleted) {
      user = await User.findByIdAndUpdate(user?.id, { isDeleted: false }, { new: true });
      token = user.generateAuthToken();
      data = { user: user, token: token }

      return res.status(STATUS_CODES.CREATED).send(sendResponse(true, "Register With Google, Welcome Back", data));
    }

    if (!user) {
      user = await User.create({ fullname: displayName, email: email, profile: photoURL, fcmToken: fcmToken, verified: true });
      token = user.generateAuthToken();
      data = { user: user, token: token }

      res.status(STATUS_CODES.CREATED).send(sendResponse(true, "Register With Google", data));
    } else {
      if (user.isBlocked) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, `Your account is blocked because of ${user.isBlockedReason}`));
      user = await User.findByIdAndUpdate(user?.id, { fcmToken: fcmToken }, { new: true });
      token = user.generateAuthToken();
      data = { user: user, token: token }

      res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Login With Google", data));
    }
  } catch (error) {
    errorHandling(error, res);
  }
}

// Connect with apple (Sign up & sign in) Controller
exports.connectWithApple = async (req, res) => {
  try {
    // Apple Sign Up & Sign In
    if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, FIELDS.FILL_ALL_FIELDS));

    const { uid, displayName, email, photoURL, fcmToken } = req.body;
    let user = await User.findOne({ uid: uid });
    let data = {}, token;

    // If the user is deleted, and wanna register again
    if (user?.isDeleted) {
      user = await User.findByIdAndUpdate(user?.id, { isDeleted: false }, { new: true });
      token = user.generateAuthToken();
      data = { user: user, token: token }

      return res.status(STATUS_CODES.CREATED).send(sendResponse(true, "Register With Apple, Welcome Back", data));
    }

    if (!user) {
      user = await User.create({ uid: uid, fullname: displayName, email: email, profile: photoURL, fcmToken: fcmToken, verified: true });
      token = user.generateAuthToken();

      data = { user: user, token: token }
      res.status(STATUS_CODES.CREATED).send(sendResponse(true, "Register With Apple", data));
    } else {
      if (user?.isBlocked) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, `Your account is blocked because of ${user.isBlockedReason}`));
      user = await User.findByIdAndUpdate(user?.id, { fcmToken: fcmToken }, { new: true });
      token = user.generateAuthToken();
      data = { user: user, token: token }

      res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Login With Apple", data));
    }

  } catch (error) {
    errorHandling(error, res);
  }
}

// Connect with Facebook (Sign up & sign in) Controller
exports.connectWithFacebook = async (req, res) => {
  try {
    if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, FIELDS.FILL_ALL_FIELDS));
    const { facebookId, displayName, email, photoURL, fcmToken } = req.body;
    let user = await User.findOne({ facebookId: facebookId });
    let data = {}, token;

    // If the user is deleted, and wanna register again
    if (user?.isDeleted) {
      user = await User.findByIdAndUpdate(user?.id, { isDeleted: false }, { new: true });
      token = user.generateAuthToken();
      data = { user: user, token: token }

      return res.status(STATUS_CODES.CREATED).send(sendResponse(true, "Register With Facebook, Welcome Back", data));
    }

    // Create a user if does not exist
    if (!user) {
      user = await User.create({ facebookId: facebookId, fullname: displayName, email: email, profile: photoURL, fcmToken: fcmToken, verified: true });
      token = user.generateAuthToken();
      data = { user: user, token: token }

      res.status(STATUS_CODES.CREATED).send(sendResponse(true, "Register With Facebook", data));
    } else {
      if (user?.isBlocked) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, `Your account is blocked because of ${user.isBlockedReason}`));

      user = await User.findByIdAndUpdate(user?.id, { fcmToken: fcmToken }, { new: true });
      token = user.generateAuthToken();
      data = { user: user, token: token }

      res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Login With Facebook", data));
    }
  } catch (error) {
    errorHandling(error, res);
  }
}