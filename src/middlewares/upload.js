import multer from 'multer';
import path from 'path';

// Allowed file types: pdf, doc, docx, png, jpg, jpeg, zip
const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.zip'];
const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream',
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${ext}. Allowed formats: PDF, DOC, DOCX, PNG, JPG, ZIP.`
      ),
      false
    );
  }
};

const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '15', 10);

// Use memoryStorage so uploaded files are streamed straight to Cloudinary without local disk storage
export const uploadAttachment = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSizeMB * 1024 * 1024 },
  fileFilter,
});
