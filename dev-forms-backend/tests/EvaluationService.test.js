import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EvaluationService } from '../src/services/EvaluationService.js';
import { prisma } from '../src/config/prisma.js';

vi.mock('../src/config/prisma.js', () => ({
  prisma: {
    submission: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    evaluation: {
      create: vi.fn(),
    },
  }
}));

describe('EvaluationService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should evaluate a submission successfully calculating final score', async () => {
    prisma.submission.findUnique.mockResolvedValue({ id: 'sub-1' });
    prisma.evaluation.create.mockResolvedValue({ id: 'eval-1', finalScore: 8 });

    const result = await EvaluationService.evaluate({
      submissionId: 'sub-1',
      criterionInnovation: 8,
      criterionDesign: 8,
      criterionTechnical: 8,
      notes: 'Bom projeto'
    }, 'judge-1');

    expect(result.id).toBe('eval-1');
    expect(prisma.evaluation.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ finalScore: 8 }) // (8+8+8)/3 = 8
    }));
  });

  it('should calculate the ranking correctly averaging scores', async () => {
    prisma.submission.findMany.mockResolvedValue([
      { 
        id: 'sub-1', 
        projectName: 'Projeto A', 
        status: 'PROCESSED', 
        evaluations: [{ finalScore: 10 }, { finalScore: 8 }] // média 9
      }, 
      { 
        id: 'sub-2', 
        projectName: 'Projeto B', 
        status: 'PROCESSED', 
        evaluations: [{ finalScore: 5 }, { finalScore: 6 }] // média 5.5
      } 
    ]);

    const ranking = await EvaluationService.getRanking('form-1');
    
    expect(ranking[0].projectName).toBe('Projeto A');
    expect(ranking[0].averageScore).toBe(9);
    
    expect(ranking[1].projectName).toBe('Projeto B');
    expect(ranking[1].averageScore).toBe(5.5);
  });
});
