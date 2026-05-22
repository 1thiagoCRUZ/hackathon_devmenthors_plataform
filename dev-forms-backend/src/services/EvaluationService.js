import { prisma } from '../config/prisma.js';

export class EvaluationService {
  static async evaluate(data, judgeId) {
    const { submissionId, criterionInnovation, criterionDesign, criterionTechnical, notes } = data;
    const subIdInt = parseInt(submissionId, 10);

    const submission = await prisma.submission.findUnique({ 
      where: { id: subIdInt },
      include: { form: true }
    });
    if (!submission) throw new Error('Submission not found');

    const user = await prisma.user.findUnique({ where: { id: judgeId } });
    if (!user) throw new Error('User not found');

    if (user.role === 'ADMIN' && !submission.form.adminsCanVote) {
      throw new Error('Administrators are not allowed to vote on this form');
    }
    if (user.role === 'DEV' && !submission.form.isVotePublic) {
      throw new Error('Public voting (DEVs) is currently disabled for this form');
    }

    const finalScore = (criterionInnovation + criterionDesign + criterionTechnical) / 3;

    try {
      const evaluation = await prisma.evaluation.create({
        data: {
          submissionId: subIdInt,
          judgeId,
          criterionInnovation,
          criterionDesign,
          criterionTechnical,
          notes,
          finalScore
        }
      });
      return evaluation;
    } catch (error) {
      // Prisma error code for Unique Constraint Violation
      if (error.code === 'P2002') {
        throw new Error('Judge has already evaluated this submission');
      }
      throw error;
    }
  }

  static async getRanking(formId) {
    const form = await prisma.form.findUnique({ where: { id: formId } });
    if (!form) throw new Error('Form not found');

    const submissions = await prisma.submission.findMany({
      where: { formId },
      include: {
        evaluations: {
          include: { judge: true } // Precisamos da role do judge para os pesos
        },
      }
    });

    const ranking = submissions.map(sub => {
      const evals = sub.evaluations;

      const judgeEvals = evals.filter(e => e.judge.role === 'JUDGE' || e.judge.role === 'ADMIN');
      const devEvals = evals.filter(e => e.judge.role === 'DEV');

      const avgJudge = judgeEvals.length > 0 
        ? judgeEvals.reduce((acc, e) => acc + e.finalScore, 0) / judgeEvals.length 
        : 0;

      const avgDev = devEvals.length > 0
        ? devEvals.reduce((acc, e) => acc + e.finalScore, 0) / devEvals.length
        : 0;

      let finalScore = 0;
      if (!form.isVotePublic) {
        finalScore = avgJudge;
      } else {
        // 80% Judge, 20% Dev
        if (judgeEvals.length === 0 && devEvals.length === 0) {
          finalScore = 0;
        } else if (judgeEvals.length > 0 && devEvals.length === 0) {
          finalScore = avgJudge;
        } else if (judgeEvals.length === 0 && devEvals.length > 0) {
          finalScore = avgDev;
        } else {
          finalScore = (avgJudge * 0.8) + (avgDev * 0.2);
        }
      }

      return {
        id: sub.id,
        projectName: sub.projectName,
        averageScore: Number(averageScore.toFixed(2)),
        evaluationsCount: evals.length,
        status: sub.status
      };
    });

    // Ordena do maior pro menor
    ranking.sort((a, b) => b.averageScore - a.averageScore);

    return ranking;
  }

  static async getVotingProgress(slug, userId) {
    const form = await prisma.form.findUnique({ where: { slug } });
    if (!form) throw new Error('Form not found');

    const submissions = await prisma.submission.findMany({
      where: { formId: form.id, status: 'PROCESSED' },
      select: { 
        id: true, 
        projectName: true, 
        description: true, 
        evaluations: { where: { judgeId: userId } } 
      }
    });

    const votedSubmissions = [];
    const pendingSubmissions = [];

    submissions.forEach(sub => {
      if (sub.evaluations.length > 0) {
        votedSubmissions.push({ id: sub.id, projectName: sub.projectName });
      } else {
        pendingSubmissions.push({ id: sub.id, projectName: sub.projectName, description: sub.description });
      }
    });

    return {
      totalSubmissions: submissions.length,
      votedSubmissions,
      pendingVotesCount: pendingSubmissions.length,
      pendingSubmissions
    };
  }

  static async getVotingReport(slug) {
    const form = await prisma.form.findUnique({ where: { slug } });
    if (!form) throw new Error('Form not found');

    // Fetch all judges and mentors
    const judges = await prisma.user.findMany({
      where: { role: { in: ['JUDGE', 'DEV'] } },
      select: { id: true, name: true, email: true, role: true }
    });

    // Fetch all processed submissions for this form
    const submissions = await prisma.submission.findMany({
      where: { formId: form.id, status: 'PROCESSED' },
      include: {
        evaluations: {
          select: { judgeId: true }
        }
      }
    });

    // Build the report
    const report = submissions.map(sub => {
      const votedJudgeIds = new Set(sub.evaluations.map(e => e.judgeId));
      
      const votedByJudges = judges
        .filter(j => j.role === 'JUDGE' && votedJudgeIds.has(j.id))
        .map(j => ({ id: j.id, name: j.name, email: j.email }));
      
      const pendingJudges = judges
        .filter(j => j.role === 'JUDGE' && !votedJudgeIds.has(j.id))
        .map(j => ({ id: j.id, name: j.name, email: j.email }));

      const votedByMentors = judges
        .filter(j => j.role === 'DEV' && votedJudgeIds.has(j.id))
        .map(j => ({ id: j.id, name: j.name, email: j.email }));
      
      const pendingMentors = judges
        .filter(j => j.role === 'DEV' && !votedJudgeIds.has(j.id))
        .map(j => ({ id: j.id, name: j.name, email: j.email }));

      return {
        id: sub.id,
        projectName: sub.projectName,
        votedByJudges,
        pendingJudges,
        votedByMentors,
        pendingMentors
      };
    });

    return report;
  }
}
