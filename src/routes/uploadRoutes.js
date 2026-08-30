import express from 'express';
import multer from 'multer';
import { uploadImage, deleteImage } from '../controllers/uploadController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Memory storage for stream uploading to Cloudinary
const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, JPEG, WEBP, SVG) are allowed.'), false);
    }
  },
});

router.post('/image', protect, upload.single('image'), uploadImage);
router.delete('/image/:publicId', protect, deleteImage);

export default router;

