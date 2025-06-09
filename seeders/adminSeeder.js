const { ADMIN_FIELDS } = require('../utils/constants');
const { User } = require("../model/user");

exports.seedAdmin = async () => {
    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: ADMIN_FIELDS.EMAIL }).select("+password");

        if (!existingAdmin) {
            // Create admin credentials
            const adminCredentials = {
                fullname: ADMIN_FIELDS.FULLNAME,
                nickname: ADMIN_FIELDS.NICKNAME,
                age: ADMIN_FIELDS.AGE,
                city: ADMIN_FIELDS.CITY,
                email: ADMIN_FIELDS.EMAIL,
                phoneNumber: ADMIN_FIELDS.PHONENUMBER,
                password: await User.hashPassword(ADMIN_FIELDS.PASSWORD),
                confirmPassword: await User.hashPassword(ADMIN_FIELDS.PASSWORD),
                verified: ADMIN_FIELDS.VERIFIED,
                role: ADMIN_FIELDS.ROLE
            };

            // Create admin user
            await User.create(adminCredentials);

            console.log("Admin created successfully");
        }

    } catch (error) {
        console.log(error.message);
    }
}