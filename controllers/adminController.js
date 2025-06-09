const path = require("path"),
    bcrypt = require("bcryptjs"),
    multer = require("multer"),
    jwt = require("jsonwebtoken"),

    { User } = require("../model/user"),
    { License } = require("../model/license"),
    { Notification } = require("../model/notification"),
    { Code } = require("../model/code"),
    { SendEmail } = require("../services/sendEmailService"),
    { sendResponse } = require("../utils/sendResponse"),
    { isEmpty } = require("../utils/isEmpty"),
    { logger } = require('../utils/logger'),
    { errorHandling } = require('../utils/errorhandling'),
    { STATUS_CODES, FIELDS, ROLES, LICENSE_STATUS, NOTIF_REDIRECT } = require('../utils/constants'),
    upload = require('../services/uploadImageService').single('profile'),
    { sendNotification } = require('../services/fcmTokenService');

// Register User Controller
exports.registerAdmin = async (req, res) => {
    try {
        // check if any value in body is empty
        if (req.user.role !== ROLES.SUPER_ADMIN) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Super Admin Credentials are required"));
        if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, FIELDS.FILL_ALL_FIELDS));
        const { email, password, confirmPassword } = req.body;

        if (await User.isEmailValid(email)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Invalid email format"));

        if (await User.isEmailTaken(email)) {
            if (await User.isEmailDeleted(email)) {
                return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Admin Already Exist"));
            }
            return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Admin Already Exist"));
        }

        // Validate password
        if (await User.isPasswordValid(password)) {
            if (password?.length < 8) {
                return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Password Length Must be 8 or more"));
            }
            return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Invalid password format"));
        }

        if (password !== confirmPassword) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Password Does't Match with Confirm Password"));

        let admin = await User.create({ ...req.body, role: ROLES.ADMIN, verified: true, password: await User.hashPassword(password), confirmPassword: await User.hashPassword(password) });
        const token = admin.generateAuthToken();
        const data = { user: admin, token: token }

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Admin Register Successfully", data));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// Login User Controller
exports.loginAdmin = async (req, res) => {
    try {
        if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, FIELDS.FILL_ALL_FIELDS));
        const { email, password, fcmToken } = req.body;

        if (await User.isEmailValid(email)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Invalid email format"));

        let user = await User.findOne({ email: email }).select("+password");
        if (!user) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "User with this email does not exist"));
        if (!user.isActive) return res.status(STATUS_CODES.FORBIDDEN).send(sendResponse(false, "Your Credentials is not active, please contact your administrator"));
        if (user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) return res.status(STATUS_CODES.FORBIDDEN).send(sendResponse(false, "Admin Credentials Required"));

        if (user && user.isDeleted) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "User with this email doesn't Exist"));
        if (user && !(await user.isPasswordMatch(password))) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Invalid Password"));

        let token = user.generateAuthToken();
        let results = { user: user, token: token };
        if (fcmToken) { user = await User.findByIdAndUpdate(user.id, { fcmToken: fcmToken }, { new: true }) }

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "logged in successfully", results));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(sendResponse(false, error.message));
    }
}

// Forget Password Controller
exports.forgetPasswordAdmin = async (req, res) => {
    try {
        if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, FIELDS.FILL_ALL_FIELDS));
        const { email } = req.body;

        // Validate email
        if (await User.isEmailValid(email)) return res.status(STATUS_CODES.BAD_REQUEST).json(sendResponse(false, 'Invalid email format'));

        // lets find user with email
        let admin = await User.findOne({ email: email });
        if (!admin) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "User with given Email doesn't exist"));

        // generate 4 digits otp
        let code = Math.floor(1000 + Math.random() * 9000);
        let vCode = await Code.findOne({ userId: admin._id });

        if (!vCode) {
            // update code with the user object
            vCode = await Code.create({ userId: admin._id, code: code });
        } else {
            return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(true, "Code aldeady Sent to your Email, Please check", vCode.code));
        }
        const data = { username: admin.fullname, code: vCode.code }
        const targetDir = '/views/forgot-email.ejs';
        const destination = path.join(__dirname, '../', targetDir);

        // Now Send email
        await SendEmail(admin.email, "Verification Code For Password Recovery", data, destination);
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Verification Code is Sent to Your Email", { adminId: admin.id, code: vCode.code }));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// Verify code Controller
exports.verifyCodeAdmin = async (req, res) => {
    try {
        if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, FIELDS.FILL_ALL_FIELDS));

        // Get code & user id from body
        const { code, adminId } = req.body;

        let vCode = await Code.findOne({ code: code, userId: adminId });
        if (vCode) {
            return res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Code Verify Successfully"));
        } else {
            return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Wrong Verification Code"));
        }

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(sendResponse(false, error.message));
    }
}

// Create New Pasword For Admin Controller
exports.confirmAdminPassword = async (req, res) => {
    try {
        if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, FIELDS.FILL_ALL_FIELDS));

        // get id & Password
        const { id } = req.params;
        const { password, confirmPassword } = req.body;

        // Validate password
        if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[a-zA-Z\d@#$!%*?&]{8,}$/)) {
            if (password.length < 8) {
                return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, 'Length Must be 8 or more'));
            }
            return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, 'Invalid password format'));
        }
        if (password !== confirmPassword) {
            return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, 'Password & Confirm Password must be same'));
        }

        const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
        const hashPassword = await bcrypt.hash(password, salt);
        const confPassword = hashPassword;

        const updatedData = { password: hashPassword, confirmPassword: confPassword }

        const options = { new: true };
        await User.findByIdAndUpdate(id, updatedData, options);
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Admin Password has been Updated...!"));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// view profile controller
exports.adminProfile = async (req, res) => {
    try {
        // view user
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Logged In Admin profile", req.user));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// Change Password (for logged in user) controller
exports.changeAdminPassword = async (req, res) => {
    try {
        if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, FIELDS.FILL_ALL_FIELDS));

        // get id and current & new password
        const { id } = req.user;
        const { currPassword, newPassword, confPassword } = req.body;
        if (newPassword !== confPassword) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Password & Confirm Passowrd not same"));

        let user = await User.findById({ _id: id }).select("+password");
        const validPassword = await bcrypt.compare(currPassword, user.password);

        if (validPassword) {
            const updatedData = { password: await User.hashPassword(newPassword), confirmPassword: await User.hashPassword(newPassword) }

            await User.findByIdAndUpdate(id, updatedData, { new: true });
            res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Admin Password has been Updated...!"));

        } else {
            return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Your Current Password isn't correct"));
        }

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// View All Admins Controller
exports.viewAllAdminsController = async (req, res) => {
    try {
        const userCount = await User.find({ $or: [{ role: ROLES.ADMIN }, { role: ROLES.SUPER_ADMIN }] }).countDocuments();
        const data = { count: userCount, results: res.paginatedResults }
        let message = res.paginatedResults ? "Get All Admin" : "No user Found";

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, message, data));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// View Admin by Id Controller
exports.viewAdminById = async (req, res) => {
    try {
        const admin = await User.findById(req.params.id);
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Get Admin By ID", admin));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// Update admin controller
exports.updateAdminController = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, err));
            } else if (err instanceof multer.MulterError) {
                res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, err));
            } else {
                const { _id } = req.user;
                const { fullname, phoneNumber, nickname, age, city } = req.body;
                let admin = await User.findById({ _id: _id });
                let updatedData = {},
                    url = process.env.BACKEND_URL || "https://lug.testdevlink.net/";

                updatedData = {
                    fullname: fullname ? fullname : admin.fullname,
                    nickname: nickname ? nickname : admin.nickname,
                    phoneNumber: phoneNumber ? phoneNumber : admin.phoneNumber,
                    age: age ? age : admin.age,
                    city: city ? city : admin.city,
                    profile: req.file === undefined || req.file === "" || req.file === null ? admin.profile : `${url}uploads/${req.file.filename}`
                }

                admin = await User.findByIdAndUpdate(_id, updatedData, { new: true });
                let data = { admin: admin, token: req.user.token }

                res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Admin Successfully Updated..!", data));
            }
        });
    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// Delete or deactivate admin controller
exports.deactivateAdmin = async (req, res) => {
    try {
        if (req.user.role !== ROLES.SUPER_ADMIN)
            return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Super Admin Required"));

        let user = await User.findById(req.params.id), message;
        if (!user)
            return res.status(STATUS_CODES.NOT_FOUND).send(sendResponse(false, "User not found"));

        user = await User.findByIdAndUpdate(req.params.id, { isActive: !user.isActive }, { new: true });
        message = user.isActive ? "Admin Activated Successfully" : "Admin Deactivated Successfully"
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, message, user));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// Refresh Token for user Controller
exports.sessionExpireAdmin = async (req, res) => {
    try {
        const refreshToken = req.headers.authorization.split(" ")[1];
        if (refreshToken === null || refreshToken === undefined || refreshToken === '') return res.status(STATUS_CODES.UNAUTHORIZED).send(sendResponse(false, "Unauthorized Token"));
        const decoded = jwt.decode(refreshToken);
        var date = new Date();
        var unixTimestamp = date.getTime() / 1000;

        if (unixTimestamp < decoded.exp) {
            res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Session Continued"));
        } else {
            res.status(STATUS_CODES.SUCCESS).send(sendResponse(false, "Session Expired"));
        }

    } catch (error) {
        errorHandling(error, res);
    }
}

// License verify by admin controller
exports.verifyUserLicense = async (req, res) => {
    try {
        let user = await User.findById(req.params.id);
        let message, title, body;
        if (!user) return res.status(STATUS_CODES.NOT_FOUND).send(sendResponse(false, "User not found"));

        if (user?.isLicenseVerified) {
            message = "License Block Successfully";
            title = "License Blocked";
            body = "Your license has been blocked, Please Contact Your Administrator";

            user = await User.findByIdAndUpdate(req.params.id, { isLicenseVerified: !user?.isLicenseVerified }, { new: true });
            await License.findByIdAndUpdate(user?.license, { isLicenseVerified: user?.isLicenseVerified, message: req.body.message, status: LICENSE_STATUS.REJECTED }, { new: true });
        } else {
            message = "License Verified Successfully";
            title = "License Verified";
            body = "Your license has been verified successfully.";

            user = await User.findByIdAndUpdate(req.params.id, { isLicenseVerified: !user?.isLicenseVerified }, { new: true });
            await License.findByIdAndUpdate(user?.license, { isLicenseVerified: user?.isLicenseVerified, message: req.body.message, status: LICENSE_STATUS.ACCEPTED }, { new: true });
        }

        sendNotification(user?.fcmToken, title, body);
        await Notification.create({ userId: user?._id, travelerId: req.user.id, travelerpostId: req.user.id, isAdmin: false, details: body, NotifRedirect: NOTIF_REDIRECT.LICENSE_REQUEST });

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, message));

    } catch (error) {
        errorHandling(error, res);
    }
}

// Get all the licenses controller by admin
exports.getAllLicenses = async (req, res) => {
    try {
        res.paginatedResults.results = await License.find().populate("userId", "fullname email phoneNumber profile isLicenseVerified")
            .sort({ isLicenseVerified: 1, _id: -1 }).exec();

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "All Licenses", res.paginatedResults));

    } catch (error) {
        errorHandling(error, res);
    }
}

// Get license by id controller
exports.getLicenseById = async (req, res) => {
    try {
        let license = await License.findById(req.params.id).populate("userId", "fullname email phoneNumber profile isLicenseVerified");
        if (!license) return res.status(STATUS_CODES.NOT_FOUND).send(sendResponse(false, "License not found"));

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "License By ID", license));

    } catch (error) {
        errorHandling(error, res);
    }
}