const multer = require('multer');
const path = require('path');

// 1. Configure Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Store in the 'uploads/' directory
  },
  filename: (req, file, cb) => {
    // Filename format: timestamp-originalname.ext
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  // For Web/Emulators, sometimes mimetype is generic (application/octet-stream).
  // We trust extname as long as it's one of our allowed types.
  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed!'), false);
  }
};

// 3. Initialize Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

module.exports = upload;
