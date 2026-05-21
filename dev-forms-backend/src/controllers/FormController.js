import { FormService } from '../services/FormService.js';

export class FormController {
  static async create(req, res) {
    try {
      const form = await FormService.create(req.body, req.user.id);
      return res.status(201).json(form);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async list(req, res) {
    try {
      const forms = await FormService.listAll();
      return res.json(forms);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async toggle(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const { isOpen } = req.body;
      const form = await FormService.toggleStatus(id, isOpen);
      return res.json(form);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}
