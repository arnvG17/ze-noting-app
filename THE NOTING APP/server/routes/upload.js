const express = require('express');
const multer = require('multer');
const router = express.Router();
const handleUpload = require('../controllers/uploadController.js');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ 
  storage,
  limits: { fileSize: 40 * 1024 * 1024 } // 40MB
});

router.post('/', (req, res, next) => {
  console.log('[DEBUG] /api/upload route hit');
  next();
}, upload.single('file'), handleUpload);


module.exports = router;

