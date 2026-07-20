const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMiddleware = multer({ storage });

// Wrapper to modify req.file.path to be a URL path
const upload = {
  single: (fieldName) => {
    return (req, res, next) => {
      uploadMiddleware.single(fieldName)(req, res, (err) => {
        if (err) return next(err);
        if (req.file) {
          req.file.path = '/uploads/' + req.file.filename;
        }
        next();
      });
    };
  }
};

const cloudinary = {}; // Mock

module.exports = { cloudinary, upload };