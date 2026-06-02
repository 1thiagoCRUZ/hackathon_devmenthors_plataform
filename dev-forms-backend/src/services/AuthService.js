import { prisma } from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { EmailService } from './EmailService.js';

export class AuthService {
  static async register(data) {
    const { name, email, password, role } = data;
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) throw new Error('User already exists');

    const passwordHash = await bcrypt.hash(password, 8);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: role || 'JUDGE' }
    });

    user.passwordHash = undefined;
    return user;
  }

  static async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) throw new Error('Invalid credentials');

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    user.passwordHash = undefined;
    return { user, token };
  }

  static async listUsers() {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
  }

  static async createUser(data) {
    const { name, email, role } = data;

    // Normalizar a role recebida do frontend
    let finalRole = 'JUDGE';
    if (role) {
      const r = role.toUpperCase();
      if (r === 'ADMIN') finalRole = 'ADMIN';
      else if (r === 'DEV' || r === 'MENTOR') finalRole = 'DEV';
      else if (r === 'JUDGE' || r === 'JUROR' || r === 'JURADO') finalRole = 'JUDGE';
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) throw new Error('Este e-mail já está cadastrado por outro usuário.');

    const defaultPassword = 'devmenthors123';
    const passwordHash = await bcrypt.hash(defaultPassword, 8);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: finalRole
      }
    });

    user.passwordHash = undefined;
    return user;
  }

  static async sendCredentialsEmail(id) {
    const userId = Number(id);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuário não encontrado.');

    // Disparar e-mail com senha padrão 'devmenthors123'
    const result = await EmailService.sendCredentials({
      name: user.name,
      email: user.email,
      password: 'devmenthors123',
      role: user.role
    });

    return result;
  }
}

