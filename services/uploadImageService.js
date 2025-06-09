const multer = require('multer');
const path = require('path');

const targetDir = 'uploads/';

const Storage = multer.diskStorage({
    // create folder name called uploads and save files
    destination: path.join(__dirname, '../', targetDir),
    // request, file and callback function
    filename: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname);
        if (fileExtension !== '.png' && fileExtension !== '.svg' && fileExtension !== '.jpg' && fileExtension !== '.gif' && fileExtension !== '.jpeg' && fileExtension !== '.webp')
            return cb('Only images are allowed');

        const fileName = Date.now() + "-" + req.user.id + "-" + file.originalname
        cb(null, fileName);
    }
});

// Uploading files (single or multiple)
const upload = multer({ storage: Storage });

module.exports = upload;