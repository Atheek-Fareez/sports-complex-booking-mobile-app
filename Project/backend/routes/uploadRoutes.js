const express = require('express');
const multer = require('multer');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadImage } = require('../controllers/uploadController');
const { protect, admin } = require('../middleware/authMiddleware');

// 1. Post to /api/upload
// 2. Protect with auth and admin access
// 3. Single file upload with field name 'image'
// Custom middleware to handle Multer errors gracefully
const handleUpload = (req, res, next) => {
  try {
    const uploadSingle = upload.single('image');
    
    uploadSingle(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error('[UPLOAD MULTER ERROR]', err.message);
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
      } else if (err) {
        console.error('[UPLOAD FILTER ERROR]', err.message);
        return res.status(400).json({ success: false, message: err.message });
      }

      // Check if file is actually attached to the request
      if (!req.file) {
        console.warn('[UPLOAD WARNING] No file found in request');
        return res.status(400).json({ success: false, message: 'No file received' });
      }

      console.log('[UPLOAD SUCCESS] File received:', req.file.filename);
      next();
    });
  } catch (error) {
    console.error('[UPLOAD FATAL ERROR]', error);
    res.status(500).json({ success: false, message: 'Fatal server error during upload initialization' });
  }
};

router.post('/', protect, admin, handleUpload, uploadImage);

module.exports = router;
