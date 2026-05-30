import { prisma } from '../config/prisma.js';
import { supabase } from '../config/supabase.js';

const BUCKET_NAME = 'submissions';

/**
 * Faz upload de arquivos diretamente para o Supabase Storage (síncrono).
 * Recebe arquivos no formato memoryStorage do multer (com campo `buffer`).
 */
async function uploadFilesToSupabase(files, submissionId) {
  const uploadedFiles = [];

  for (const file of files) {
    const filePathInBucket = `${submissionId}/${Date.now()}_${file.originalname}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePathInBucket, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(`Falha no upload do arquivo ${file.originalname}: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePathInBucket);

    uploadedFiles.push({
      name: file.originalname,
      url: urlData.publicUrl,
    });
  }

  return uploadedFiles;
}

export class SubmissionService {
  static async processSubmission(data, files) {
    const { formId, projectName, description, leaderEmail, teamMembers, links, usedAI, aiDescription } = data;

    // 1. Valida se o formulário existe e está aberto
    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: { isOpen: true },
    });

    if (!form || !form.isOpen) {
      throw new Error('Form is closed or does not exist.');
    }

    const hasFiles = files && files.length > 0;

    // 2. Faz upload dos arquivos de forma síncrona (se houver)
    let uploadedFiles = [];
    if (hasFiles) {
      uploadedFiles = await uploadFilesToSupabase(files, `temp_${Date.now()}`);
    }

    // 3. Cria a Submission no banco já com status PROCESSED e URLs resolvidas
    const submission = await prisma.submission.create({
      data: {
        formId,
        projectName,
        description,
        leaderEmail,
        teamMembers,
        links,
        files: uploadedFiles.length > 0 ? uploadedFiles : [],
        status: 'PROCESSED',
        usedAI: usedAI ?? false,
        aiDescription: usedAI ? (aiDescription || null) : null,
      },
    });

    return { queued: false, submission };
  }
}
