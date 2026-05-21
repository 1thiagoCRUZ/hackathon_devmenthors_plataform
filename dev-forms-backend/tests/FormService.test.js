import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormService } from '../src/services/FormService.js';
import { prisma } from '../src/config/prisma.js';

vi.mock('../src/config/prisma.js', () => ({
  prisma: {
    form: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  }
}));

describe('FormService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new form if slug does not exist', async () => {
    prisma.form.findUnique.mockResolvedValue(null); // Nenhum form com esse slug
    
    const mockCreatedForm = { id: '1', title: 'Hackathon', slug: 'hack', isOpen: true };
    prisma.form.create.mockResolvedValue(mockCreatedForm);

    const result = await FormService.create({ title: 'Hackathon', slug: 'hack' }, 'creator-1');

    expect(prisma.form.findUnique).toHaveBeenCalledWith({ where: { slug: 'hack' } });
    expect(prisma.form.create).toHaveBeenCalled();
    expect(result).toEqual(mockCreatedForm);
  });

  it('should throw an error if form slug already exists', async () => {
    prisma.form.findUnique.mockResolvedValue({ id: '2', slug: 'hack' });

    await expect(FormService.create({ title: 'Test', slug: 'hack' }, 'creator'))
      .rejects.toThrow('Form with this slug already exists');
  });

  it('should list all forms', async () => {
    prisma.form.findMany.mockResolvedValue([{ id: '1' }, { id: '2' }]);
    const result = await FormService.listAll();
    expect(prisma.form.findMany).toHaveBeenCalled();
    expect(result).toHaveLength(2);
  });
});
