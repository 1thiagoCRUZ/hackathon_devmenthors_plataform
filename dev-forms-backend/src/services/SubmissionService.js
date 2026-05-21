import { prisma } from '../config/prisma.js';
import { uploadQueue } from '../config/queue.js';

export class SubmissionService {
  static async processSubmission(data, files) {
    const { formId, projectName, description, leaderEmail, teamMembers, links } = data;

    // 1. Validação ágil: apenas checa se existe e está aberto
    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: { isOpen: true },
    });

    if (!form || !form.isOpen) {
      throw new Error('Form is closed or does not exist.');
    }

    const hasFiles = files && files.length > 0;

    // 2. Persistência Rápida (sem esperar upload para nuvem)
    const submission = await prisma.submission.create({
      data: {
        formId,
        projectName,
        description,
        leaderEmail,
        teamMembers,
        links,
        status: hasFiles ? 'PROCESSING' : 'PROCESSED',
      },
    });

    // 3. Offload para Fila de Mensageria se houver arquivos
    if (hasFiles) {
      await uploadQueue.add('process-files', {
        submissionId: submission.id,
        files: files.map(f => ({
          originalname: f.originalname,
          mimetype: f.mimetype,
          path: f.path, // Caminho temporário gerado pelo multer
          size: f.size
        }))
      });
      return { queued: true, submission };
    }

    return { queued: false, submission };
  }
}
