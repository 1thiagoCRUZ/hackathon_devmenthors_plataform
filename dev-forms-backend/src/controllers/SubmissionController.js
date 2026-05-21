import { SubmissionService } from '../services/SubmissionService.js';
import { prisma } from '../config/prisma.js';
import QRCode from 'qrcode';

export class SubmissionController {
  static async create(req, res) {
    try {
      // 1. Pega o slug da URL (req.params)
      const { slug } = req.params;
      const { projectName, description, leaderEmail, teamMembers, links } = req.body;
      const files = req.files || []; 

      // 2. Busca no Prisma pelo formId atrelado a esse slug e já checa se está aberto
      const form = await prisma.form.findUnique({
        where: { slug },
        select: { id: true, isOpen: true },
      });

      // 3. Valida se o formulário existe e está aberto
      if (!form || !form.isOpen) {
        return res.status(400).json({ error: 'Formulário fechado ou não encontrado.' });
      }

      const parsedTeamMembers = typeof teamMembers === 'string' ? JSON.parse(teamMembers) : teamMembers;
      const parsedLinks = typeof links === 'string' ? JSON.parse(links) : links;

      // 4. Repassa o formId correto (form.id) e os dados para o Service
      const result = await SubmissionService.processSubmission({
        formId: form.id,
        projectName,
        description,
        leaderEmail,
        teamMembers: parsedTeamMembers,
        links: parsedLinks,
      }, files);

      if (result.queued) {
        return res.status(202).json({
          message: 'Submission accepted. Files are being processed in the background.',
          submissionId: result.submission.id,
        });
      }

      return res.status(201).json({
        message: 'Submission created successfully.',
        submission: result.submission,
      });

    } catch (error) {
      if (error.message === 'Form is closed or does not exist.') {
        return res.status(400).json({ error: error.message });
      }
      console.error('[SubmissionController Error]', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async listByForm(req, res) {
    try {
      const { slug } = req.params;
      const form = await prisma.form.findUnique({ where: { slug } });
      if (!form) return res.status(404).json({ error: 'Formulário não encontrado.' });

      const submissions = await prisma.submission.findMany({
        where: { formId: form.id, status: 'PROCESSED' },
        select: { id: true, projectName: true, description: true, status: true, leaderEmail: true, teamMembers: true, links: true, files: true }
      });

      const qrCodeOptions = {
        scale: 10,
        width: 300
      };

      // Gera um QR code dinâmico para a página de avaliação de cada projeto listado
      const submissionsWithQR = await Promise.all(submissions.map(async (sub) => {
        const evaluationUrl = `https://seudominio.com/evaluations/${sub.id}`;
        const qrCode = await QRCode.toDataURL(evaluationUrl, qrCodeOptions);
        return { ...sub, qrCode };
      }));

      return res.json(submissionsWithQR);
    } catch (error) {
      console.error('[SubmissionController List Error]', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
