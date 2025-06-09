const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
// const fs = require('fs');
// const { google } = require('googleapis');
// For aws
const AWS = require('../config/amazon.config');
const s3 = new AWS.S3();
const storage = multer.memoryStorage();
const uploadLisense = multer({ storage: storage });

const { Code } = require("../model/code");
const { User } = require('../model/user');
const { Travel } = require('../model/travel');
const { TravelRequest } = require('../model/TravelerRequest');
const { Notification } = require('../model/notification');
const { License } = require('../model/license');
const { SendEmail } = require('../services/sendEmailService');
const { isEmpty } = require('../utils/isEmpty');
const { sendResponse } = require('../utils/sendResponse');
const { errorHandling } = require('../utils/errorhandling');
const { STATUS_CODES, FIELDS, ROLES } = require('../utils/constants');
const { Chat } = require('../model/chat');
const upload = require('../services/uploadImageService').single('profile');
// const uploadLisense = require('../services/uploadImageService');
// const apikeys = require('../config/apikeys.json');
// const SCOPE = ['https://www.googleapis.com/auth/drive.file'];

// Forget Password Controller
exports.forgetPassword = async (req, res) => {
    try {
        if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Please fill all the fields"));

        const { email } = req.body;
        // Validate email
        if (await User.isEmailValid(email)) return res.status(STATUS_CODES.BAD_REQUEST).json(sendResponse(false, 'Invalid email format'));

        let user = await User.findOne({ email: email });
        if (!user) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "User with given Email doesn't exist"));
        if (user?.isDeleted) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "User with given Email doesn't exist"));

        let code = Math.floor(1000 + Math.random() * 9000);
        let vCode = await Code.findOne({ userId: user._id });

        if (!vCode) {
            vCode = await Code.create({ userId: user._id, code: code });
        } else {
            return res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Code aldeady Sent to your Email, Please check", vCode.code));
        }
        const data = { username: user?.fullname, code: vCode.code }
        const targetDir = '/views/forgot-email.ejs';
        const destination = path.join(__dirname, '../', targetDir);

        // Now Send email
        await SendEmail(user.email, "Verification Code For Password Recovery", data, destination);
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Verification Code is Sent to Your Email", { userId: user.id, code: vCode.code }));

    } catch (error) {
        errorHandling(error, res);
    }
}

// Verify code Controller
exports.verifyCode = async (req, res) => {
    try {
        if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Please fill all the fields"));

        // Get code & user id from body
        const { code, userId } = req.body;

        let vCode = await Code.findOne({ code: code, userId: userId });
        if (vCode) {
            return res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Code Verify Successfully"));
        } else {
            return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Wrong Verification Code"));
        }

    } catch (error) {
        errorHandling(error, res);
    }
}

// Create New Pasword For User Controller
exports.confirmPassword = async (req, res) => {
    try {
        if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Please fill all the fields"));

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
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Password has been Updated...!"));

    } catch (error) {
        errorHandling(error, res);
    }
}

// Change Password (for logged in user) controller
exports.changePassword = async (req, res) => {
    try {
        if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, FIELDS.FILL_ALL_FIELDS));

        // get id and current & new password
        const { id } = req.user;
        const { currPassword, newPassword, confPassword } = req.body;

        if (newPassword !== confPassword) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Password & Confirm Passowrd not same"));

        let user = await User.findById({ _id: id });

        const currentPassword = currPassword;
        const validPassword = await bcrypt.compare(currentPassword, user.password);

        if (validPassword) {
            const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
            const hashPassword = await bcrypt.hash(newPassword, salt);
            const confirmPassword = hashPassword;

            const updatedData = { password: hashPassword, confirmPassword: confirmPassword, }
            const options = { new: true };

            await User.findByIdAndUpdate(id, updatedData, options);
            res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Password has been Updated...!"));

        } else {
            return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Your Current Password isn't correct"));
        }

    } catch (error) {
        errorHandling(error, res);
    }
}

// view profile controller
exports.userProfile = async (req, res) => {
    try {
        let user = await User.findById(req.user._id).populate("license");

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Logged In user profile", user));

    } catch (error) {
        errorHandling(error, res);
    }
}

// update user profile controller
exports.updateUserProfile = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, err));
            } else if (err instanceof multer.MulterError) {
                res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, err));
            } else {
                const { _id } = req.user;
                const { fullname, phoneNumber, nickname, bio } = req.body;
                let user = await User.findById({ _id: _id });
                let updatedData = {},
                    url = process.env.BACKEND_URL || "https://lug.testdevlink.net/";
                let userScore = await TravelRequest.find({ travelerId: user._id, isPaid: true }).countDocuments();

                updatedData = {
                    fullname: fullname ? fullname : user?.fullname,
                    nickname: nickname ? nickname : user?.nickname,
                    phoneNumber: phoneNumber ? phoneNumber : user?.phoneNumber,
                    bio: bio ? bio : user?.bio,
                    profile: req.file === undefined || req.file === "" || req.file === null ? user.profile : `${url}uploads/${req.file.filename}`
                }

                user = await User.findByIdAndUpdate(_id, updatedData, { new: true });
                let data = { user: user, token: req.user.token, userScore }

                res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "User Successfully Updated..!", data));
            }
        });

    } catch (error) {
        errorHandling(error, res);
    }
}

// Delete User By ID Controller
exports.delUser = async (req, res) => {
    try {
        // Delete User
        let deleteUser = await User.findById(req.user.id);
        if (!deleteUser) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "User Not Found"));
        if (deleteUser?.isDeleted) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "User Already Deleted"));

        deleteUser = await User.findByIdAndUpdate(deleteUser.id, { isDeleted: true }, { new: true });
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "User Delete Successfully"));

    } catch (error) {
        errorHandling(error, res);
    }
}

// add long & lat while user hit home screen controller
exports.setLongLat = async (req, res) => {
    try {
        if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Please fill all the fields"));

        await User.findByIdAndUpdate(req.user._id, { longitude: req.body.longitude, latitude: req.body.latitude }, { new: true });
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Longitude & Latitude Saved"));

    } catch (error) {
        errorHandling(error, res);
    }
}

// Refresh Token for user Controller
exports.sessionExpire = async (req, res) => {
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

// Get All Users for administration
exports.getAllUsers = async (req, res) => {
    try {
        const userCount = await User.find({ role: ROLES.USER }).countDocuments();
        const data = { count: userCount, results: res.paginatedResults }
        let message = res.paginatedResults ? "Get All Users" : "No user Found";

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, message, data));

    } catch (error) {
        errorHandling(error, res);
    }
}

// Get User by ID controller on admin panel
exports.getUserByID = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // For Chat Pagination
        const chatPage = parseInt(req.query.chatPage) || 1;
        const chatLimit = parseInt(req.query.chatLimit) || 10;
        const skip = (chatPage - 1) * chatLimit;

        let user = await User.findById(req.params.id);
        let allAdminsId = [];
        let allAdmin = await User.find({ $or: [{ role: ROLES.SUPER_ADMIN }, { role: ROLES.ADMIN }] });
        for (let i = 0; i < allAdmin.length; i++) { allAdminsId.push(allAdmin[i].id) }

        let chatList;
        if (user?.chatFriends) {
            // Filter out admin chats
            const nonAdminChatFriends = user?.chatFriends.filter(chatFriend => !allAdminsId.includes(chatFriend.userId) && !allAdminsId.includes(chatFriend.senderId));

            // Paginate the chatFriends array
            const paginatedChatFriends = nonAdminChatFriends?.slice(skip, skip + chatLimit);
            chatList = await Promise.all(paginatedChatFriends?.map(async (list) => {
                return {
                    user: await User.findById(list?.userId).select("profile fullname email nickname"),
                    chat: list?.chat,
                    type: list?.contentType,
                    read: list?.read,
                    senderId: list?.senderId ? await User.findById(list?.senderId).select("profile fullname email nickname") : ''
                }
            }));
        }

        const travelCount = await Travel.find({ userId: user.id }).countDocuments();
        const travels = await Travel.find({ userId: user.id }).sort({ _id: -1 }).limit(limit).skip(page);
        const travelRequests = await TravelRequest.find({ userId: { $in: user.id } });

        const chatListCount = user?.chatFriends?.filter(chatFriend => !allAdminsId.includes(chatFriend.userId) && !allAdminsId.includes(chatFriend.senderId)).length;
        user = await User.findById(user.id).select('-chatFriends');
        let data = {
            user: user,
            chatlist: chatList,
            chatListCount: chatListCount || 0,
            travels: travels,
            travelCount: travelCount,
            travelRequests: travelRequests
        }
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Get User By ID", data));

    } catch (error) {
        errorHandling(error, res);
    }
}

// get chat list for specific user by id controller
exports.getUserChat = async (req, res) => {
    try {
        const chats = await Chat.find({
            $or: [
                { sender: req.query.sender, receiver: req.query.receiver }, { sender: req.query.receiver, receiver: req.query.sender }
            ]
        });

        let chatList;
        if (chats && chats) {
            chatList = await Promise.all(chats?.map(async (chat) => {
                return {
                    sender: await User.findById(chat?.sender).select("profile fullname email nickname"),
                    receiver: await User.findById(chat?.receiver).select("profile fullname email nickname"),
                    chat: chat?.message,
                    type: chat?.type
                }
            }));
        }

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "All Messages for speficied user", chatList));

    } catch (error) {
        errorHandling(error, res);
    }
}

// user with most no of travels controller for admin panel
exports.mostNoOfTravelsByUsers = async (req, res) => {
    try {
        // Aggregate to find the top 5 most active users
        const result = await Travel.aggregate([
            { $group: { _id: "$userId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Populate user data for each result
        const populatedResults = await Promise.all(result.map(async item => {
            const user = await User.findById(item._id).select("fullname email phoneNumber profile");
            return {
                user: user,
                count: item.count
            };
        }));

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Top 5 Most Travelers", populatedResults));

    } catch (error) {
        errorHandling(error, res);
    }
}

// De-Activate user by admin
exports.blockedUserByAdmin = async (req, res) => {
    try {
        let user = await User.findById(req.params.id), message;
        user = await User.findByIdAndUpdate(req.params.id, { isBlocked: !user.isBlocked, isBlockedReason: req.body.reason }, { new: true });
        message = user.isBlocked ? "User Block Successfully" : "User Unblock Successfully";
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, message, user));

    } catch (error) {
        errorHandling(error, res);
    }
}

// Search User by keyword controller
exports.searchUser = async (req, res) => {
    try {
        const keyword = req.query.search && {
            $or: [
                { fullname: { $regex: req.query.search, $options: 'i' } },
                { nickname: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } }
            ]
        }
        const user = await User.find(keyword).find({ role: { $ne: req.user.role } });

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Users succesfully search", user));

    } catch (error) {
        errorHandling(error, res);
    }
}

// Verify License controller
exports.verifyLicense = async (req, res) => {
    try {
        uploadLisense.single('image')(req, res, async (err) => {
            if (err) {
                return errorHandling(err, res);
            }

            if (!req.file) {
                return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "No file uploaded"));
            }

            if (req.user.isLicenseVerified) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Already Verified"));

            try {
                const file = req.file;

                const params = {
                    Bucket: 'lug-traveler-uploads',
                    Key: `${Date.now()}-${req.user.id}-${file.originalname}`,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    // ACL: 'public-read'
                }

                s3.upload(params, async (err, data) => {
                    if (err) {
                        return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, err.message));
                    }
                    let license = await License.create({ userId: req.user.id, licenseImage: data?.Location });
                    await User.findOneAndUpdate(req.user._id, { licenseImage: data?.Location, license: license?._id }, { new: true });
                    await Notification.create({ userId: req.user.id, travelerId: req.user.id, travelerpostId: req.user.id, isAdmin: true, details: "Verification Image Recieved" });

                    res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Verification Image Uploaded"));
                });

            } catch (error) {
                errorHandling(error, res);
            }
        });

    } catch (error) {
        errorHandling(error, res);
    }
}

//  Message & status of verified license image user Controller
exports.getMessageAndStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("license").populate("license", "isLicenseVerified status message");
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Message & Status of Verified License Image", user));

    } catch (error) {
        errorHandling(error, res);
    }
}