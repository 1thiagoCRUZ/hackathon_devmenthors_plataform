import { prisma } from '../config/prisma.js';
import QRCode from 'qrcode';

export class FormService {
  static async create(data, creatorId) {
    const { title, slug } = data;
    const exists = await prisma.form.findUnique({ where: { slug } });
    if (exists) throw new Error('Form with this slug already exists');

    const form = await prisma.form.create({
      data: { title, slug, creatorId, isOpen: true }
    });
    
    const qrCodeOptions = {
      scale: 10,
      width: 300
    };

    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const normalizedFrontendUrl = frontendBaseUrl.replace(/\/+$|^\s+|\s+$/g, '');
    const formUrl = `${normalizedFrontendUrl}/${slug}`;
    const qrCode = await QRCode.toDataURL(formUrl, qrCodeOptions);

    return { ...form, qrCode, url: formUrl };
  }

  static async listAll() {
    return prisma.form.findMany();
  }

  static async toggleStatus(formId, isOpen) {
    return prisma.form.update({
      where: { id: formId },
      data: { isOpen }
    });
  }
}
