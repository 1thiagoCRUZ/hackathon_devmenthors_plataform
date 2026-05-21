import multer from 'multer';
import fs from 'fs';

const tempDir = 'uploads/temp/';
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

export const uploadMiddleware = multer({ 
  dest: tempDir, 
  limits: { fileSize: 50 * 1024 * 1024 }
}).array('files', 5);
