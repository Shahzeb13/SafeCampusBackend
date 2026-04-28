import multer from 'multer';
import path from 'path';

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); // make sure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + '-' + Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

// file filter (important)
const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image, video, audio allowed'));
  }
};
// multer instance

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
});

export const uploadIncidentMedia = upload.fields([
  { name: 'images', maxCount: 3 },
  { name: 'video', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
]);

export const uploadAvatar = upload.single('avatar');