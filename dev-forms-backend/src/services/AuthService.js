import { prisma } from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
}
