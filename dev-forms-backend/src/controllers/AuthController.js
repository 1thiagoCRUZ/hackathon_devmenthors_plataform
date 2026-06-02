import { AuthService } from '../services/AuthService.js';

export class AuthController {
  static async register(req, res) {
    try {
      const user = await AuthService.register(req.body);
      return res.status(201).json(user);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const data = await AuthService.login(email, password);
      return res.json(data);
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  }

  static async listUsers(req, res) {
    try {
      const users = await AuthService.listUsers();
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createUser(req, res) {
    try {
      const user = await AuthService.createUser(req.body);
      return res.status(201).json(user);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async sendCredentialsEmail(req, res) {
    try {
      const { id } = req.params;
      const result = await AuthService.sendCredentialsEmail(id);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

