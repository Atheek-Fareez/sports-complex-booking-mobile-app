// @desc    Upload an image
// @route   POST /api/upload
// @access  Private/Admin
const uploadImage = (req, res) => {
  try {
    // The handleUpload middleware already checks for !req.file, but this is a safety fallback.
    if (!req.file) {
      console.error('[CONTROLLER ERROR] File object not found');
      return res.status(400).json({ success: false, message: 'No file received' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    console.log('[DEBUG] Returning Success Response:', imageUrl);
    
    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      fileName: req.file.filename
    });
  } catch (error) {
    console.error('[CONTROLLER FATAL ERROR]', error.message);
    return res.status(500).json({ success: false, message: 'Server error during upload response' });
  }
};

module.exports = {
  uploadImage
};
