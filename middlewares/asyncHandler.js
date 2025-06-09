const { errorHandling } = require('../utils/errorhandling');

exports.asyncHandler = ((fn) => (req, res) => {
    Promise.resolve(fn(req, res)).catch((err) => {
        errorHandling(err, res);
    });
});