// While Empty Fields
exports.FIELDS = Object.freeze({
    FILL_ALL_FIELDS: "Please fill all the fields"
});

// Enum For roles
exports.ROLES = Object.freeze({
    USER: "user",
    ADMIN: "admin",
    SUPER_ADMIN: "superAdmin"
});

// Admin Fields for registering data
exports.ADMIN_FIELDS = Object.freeze({
    FULLNAME: "Admin",
    NICKNAME: "Admin",
    AGE: 24,
    CITY: "NYC",
    EMAIL: "admin@admin.com",
    PHONENUMBER: 123456789,
    PASSWORD: "Admin@#123",
    VERIFIED: true,
    ROLE: this.ROLES.SUPER_ADMIN
});

// Database constants
exports.DATABASE = Object.freeze({
    SUCCESS: "Connected to Database Successfully",
    FAIL: "Could not Connected to DB..."
});

// Status codes
exports.STATUS_CODES = Object.freeze({
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
});

// Weight constant
exports.WEIGHT_UNIT = Object.freeze({
    KILOGRAM: "kg",
    POUND: "lbs"
});

// Weight constant
exports.COST_UNIT = Object.freeze({
    DOLLAR: "dollar",
    POUND: "pound"
});

// status constant
exports.STATUS = Object.freeze({
    PENDING: "Pending",
    DELIVERED: "Delivered"
});

// services constant
exports.SERVICES = Object.freeze({
    IDLE: "idle",
    ACCEPT: "Accept",
    REJECT: "Reject",
    NOT_SELECTED_BY_TRAVELER: "Not Selected By Traveler"
});

// Status constant
exports.ONLINE_STATUS = Object.freeze({
    IDLE: "IDLE",
    ONLINE: "ONLINE",
    OFFLINE: "OFFLINE"
});

// Notification Redirect constant
exports.NOTIF_REDIRECT = Object.freeze({
    HOME: 'home',
    TRAVEL_REQUEST: 'travel_request',
    LUGGAGE_REQUEST: 'luggage_request',
    REVIEW_TRAVELER: 'review_traveler',
    LICENSE_REQUEST: 'license_request'
});

// Images
exports.IMAGES = {
    DEFAULT_IMAGE: `${process.env.BACKEND_URL || "https://lug.testdevlink.net/"}uploads/icon.jpg`,
    IMAGE_URL: `${process.env.BACKEND_URL || "https://lug.testdevlink.net/"}uploads/`
}

// All API Constants
// Auth API constants (For Both Admin And User)
exports.AUTH_API_CONSTANTS = Object.freeze({
    AUTH: "/auth",
    ADMIN: "/admin",
    USER: "/user",
    AUTH_REGISTER: "/register",
    AUTH_VERIFY: "/:id/verify/:token/",
    AUTH_lOGIN: "/login",
    AUTH_LOGOUT: "/logout",
    CONNECT_WITH_GOOGLE: "/connectwithgoogle",
    CONNECT_WITH_APPLE: "/connectwithapple",
    CONNECT_WITH_FACEBOOK: "/connectwithfacebook"
});

// User & Admin API Constants
exports.FLOW_API_CONSTANTS = Object.freeze({
    ALL_ADMIN: "/",
    ALL_USER: "/",
    ADMIN_DEACTIVATE: "/deactivateadmin",
    FORGET_PASSWORD: "/forgetpassword",
    VERIFY_CODE: "/verifycode",
    USER_PROFILE: "/getuserprofile",
    ADMIN_PROFILE: "/getprofile",
    UPDATE_ADMIN_PROFILE: "/updateadminprofile",
    CONFRIM_USER_PASSWORD: "/confirmpassword",
    CONFRIM_ADMIN_PASSWORD: "/confirmadminpassword",
    CHANGE_ADMIN_PASSWORD: "/changeadminpassword",
    REFRESH_TOKEN_ADMIN: '/refreshtokenadmin',
    SET_LONG_LAT: '/setlonglat',
    SESSION_EXPIRE: '/sessionexpire',
    MOST_NO_OF_TRAVEL_BY_USER: '/mostnooftravelbyuser',
    DE_ACTIVATE_ADMIN: '/deactivateadmin',
    BLOCKED_USER_BY_ADMIN: '/blockeduserbyadmin',
    REPORT: '/report',
    REPORT_USER: '/reportuser',
    ALL_REPORTS: '/allreports',
    REPORT_DETAILS_BY_ID: '/reportdetailsbyid',
    GET_ALL_MESSAGES: '/getallmessages',
    VERIFY_LISENSE: '/verifylicense',
    VERIFY_LISENSE_BY_ADMIN: '/verifylicensebyadmin',
    GET_ALL_LICENSES: '/getalllicenses',
    GET_LICENSE_BY_ID: '/getlicensebyid'
});

exports.DASHBOARD_CONSTANT = Object.freeze({
    DASHBOARD: "/dashboard",
    DASHBOARD_DATA: '/'
})

exports.NOTIFICATION = Object.freeze({
    NOTIFICATION: '/notification',
    NOTIFICATION_FOR_ADMIN: '/notifforadmin',
    NOTIFICATION_FOR_USER_BY_ADMIN: '/notifforuserbyadmin'
});

exports.POST_TRAVEL = Object.freeze({
    POST_TRAVEL_ADMIN: '/posttraveladmin'
});

exports.FIND_TRAVEL_REQUEST = Object.freeze({
    FIND_TRAVEL_REQUEST_ADMIN: '/alltravelrequestadmin',
    SHOW_REQUESTED_PACKAGES: '/showrequestedpackages',
    GET_TRAVEL_FOR_SCREEN: '/gettravelforscreen'
});

exports.REVIEWS = Object.freeze({
    REVIEW: '/review',
    ADD_REVIEW: '/addreview',
    ALL_REVIEWS: '/allreviews',
    DELETE_REVIEW: '/deletereview',
    UPDATE_REVIEW: '/updatereview'
});

exports.LICENSE_STATUS = Object.freeze({
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    REJECTED: "Rejected"
});

exports.STRIPE_ACCOUNT_STATUS = Object.freeze({
    PENDING: "pending",
    RESTRICTED: "Restricted",
    RESTRICTED_SOON: "Restricted soon",
    ENABLED: "Enabled",
    COMPLETED: "completed",
    REJECTED: "rejected"
});