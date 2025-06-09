// Model for send response
exports.sendResponse = (success, message, data) => {
    if (data != null) {
        return { success: success, message: message, data: data };
    } else {
        return { success: success, message: message };
    }
}