import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadImage, deleteImage } from '../controllers/uploadController.js';
import { protect } from '../middlewares/auth.js';
import { ALLOWED_IMAGE_EXTENSIONS } from '../utils/fileValidation.js';

const router = express.Router();

const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);

// Memory storage for direct streaming into MongoDB GridFS
const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: maxFileSizeMB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_IMAGE_EXTENSIONS.includes(ext) && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid image file format. Allowed: JPG, PNG, WEBP, SVG.`), false);
    }
  },
});

router.post('/image', protect, upload.single('image'), uploadImage);
router.delete('/image/:publicId', protect, deleteImage);

export default router;
