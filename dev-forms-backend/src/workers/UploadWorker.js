import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { supabase } from '../config/supabase.js';
import { prisma } from '../config/prisma.js';
import fs from 'fs/promises';
const BUCKET_NAME = 'submissions';

const processFiles = async (job) => {
  const { submissionId, files } = job.data;
  const uploadedFilesUrls = [];

  try {
    for (const file of files) {
      try {
        // 1. Lê o arquivo em memória
        const fileBuffer = await fs.readFile(file.path);
        
        // 2. Define um caminho único
        const filePathInBucket = `${submissionId}/${Date.now()}_${file.originalname}`;

        // 3. Envia para o Supabase Storage
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePathInBucket, fileBuffer, {
            contentType: file.mimetype,
            upsert: true
          });

        if (error) {
          throw new Error(`Falha no upload do arquivo ${file.originalname}: ${error.message}`);
        }

        // 4. Pega a URL Pública gerada pelo Supabase
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePathInBucket);
        
        uploadedFilesUrls.push({
          name: file.originalname,
          url: urlData.publicUrl
        });
      } finally {
        // 5. Libera espaço no disco local SEMPRE (dando erro ou sucesso no upload acima)
        await fs.unlink(file.path).catch(console.error);
      }
    }

    // 6. Atualiza status no banco (só chega aqui se TODOS os arquivos subirem)
    await prisma.submission.update({
      where: { id: submissionId },
      data: { files: uploadedFilesUrls, status: 'PROCESSED' }
    });

  } catch (error) {
    // Atualiza pro status de erro se qualquer arquivo falhar
    await prisma.submission.update({ where: { id: submissionId }, data: { status: 'ERROR' } });
    throw error;
  }
};

// Instanciação do Worker
export const startUploadWorker = () => {
  const worker = new Worker('upload-queue', processFiles, {
    connection: redisConnection,
    concurrency: 10, // Define quantos uploads ocorrem simultaneamente por instância de worker
  });
  
  worker.on('completed', job => {
    console.log(`Job com id ${job.id} finalizado para a submissão ${job.data.submissionId}`);
  });

  worker.on('failed', (job, err) => {
    console.log(`Job com id ${job.id} falhou: ${err.message}`);
  });

  return worker;
};

// Se o script for rodado diretamente (como via PM2)
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startUploadWorker();
  console.log('Upload Worker started standalone.');
}
