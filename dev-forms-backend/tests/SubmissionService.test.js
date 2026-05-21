import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubmissionService } from '../src/services/SubmissionService.js';
import { uploadQueue } from '../src/config/queue.js';
import { prisma } from '../src/config/prisma.js';

vi.mock('../src/config/prisma.js', () => ({
  prisma: {
    form: { findUnique: vi.fn() },
    submission: { create: vi.fn() },
  }
}));

vi.mock('../src/config/queue.js', () => ({
  uploadQueue: {
    add: vi.fn(),
  }
}));



describe('SubmissionService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw an error if form is closed', async () => {
    prisma.form.findUnique.mockResolvedValue({ isOpen: false });

    await expect(SubmissionService.processSubmission({ formId: 'form-1' }, []))
      .rejects.toThrow('Form is closed or does not exist.');
  });

  it('should save submission directly as PROCESSED if no files attached', async () => {
    prisma.form.findUnique.mockResolvedValue({ isOpen: true });
    prisma.submission.create.mockResolvedValue({ id: 'sub-1', status: 'PROCESSED' });

    const result = await SubmissionService.processSubmission({ formId: 'form-1' }, []);

    expect(prisma.submission.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'PROCESSED' })
    }));
    expect(uploadQueue.add).not.toHaveBeenCalled();
    expect(result.queued).toBe(false);
  });

  it('should queue files if files are provided and return queued: true', async () => {
    prisma.form.findUnique.mockResolvedValue({ isOpen: true });
    prisma.submission.create.mockResolvedValue({ id: 'sub-1', status: 'PROCESSING' });

    const files = [{ originalname: 'test.pdf', mimetype: 'application/pdf', path: 'temp/123', size: 100 }];
    const result = await SubmissionService.processSubmission({ formId: 'form-1' }, files);

    expect(uploadQueue.add).toHaveBeenCalled();
    expect(result.queued).toBe(true);
  });
});
