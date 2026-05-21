import 'dotenv/config';
import app from './app.js';
import { startUploadWorker } from './workers/UploadWorker.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startUploadWorker();
  console.log('Upload Worker started.');
});
