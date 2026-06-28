import { EvaluationService } from '../services/EvaluationService.js';

export class EvaluationController {
  static async evaluate(req, res) {
    try {
      const evaluation = await EvaluationService.evaluate(req.body, req.user.id);
      return res.status(201).json({ message: 'Avaliação registrada com sucesso!', evaluation });
    } catch (error) {
      if (error.message === 'Judge has already evaluated this submission') {
        return res.status(409).json({ error: error.message });
      }
      if (error.message === 'Submission not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  }

  static async ranking(req, res) {
    try {
      const formId = parseInt(req.params.formId, 10);
      const ranking = await EvaluationService.getRanking(formId);
      return res.json({ ranking });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getVotingProgress(req, res) {
    try {
      const { slug } = req.params;
      const progress = await EvaluationService.getVotingProgress(slug, req.user.id);
      return res.json(progress);
    } catch (error) {
      if (error.message === 'Form not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getVotingReport(req, res) {
    try {
      const { slug } = req.params;
      const report = await EvaluationService.getVotingReport(slug);
      return res.json(report);
    } catch (error) {
      if (error.message === 'Form not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async sendWinnerEmail(req, res) {
    try {
      const { submissionId, position, customMessage } = req.body;
      const result = await EvaluationService.sendWinnerEmail(submissionId, position, customMessage);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}
