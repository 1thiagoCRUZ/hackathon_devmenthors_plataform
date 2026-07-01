import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class EmailService {
  /**
   * Inicializa o transporte SMTP.
   * Se as variáveis no .env não estiverem preenchidas, cria uma conta temporária Ethereal.
   */
  static async getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      // Transporter de produção real
      return {
        transporter: nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass }
        }),
        from: process.env.SMTP_FROM || `"DevMenthors" <${user}>`,
        isTest: false
      };
    }

    // Fallback: Conta de Teste do Ethereal Mail
    console.log('\n[EmailService] Variáveis SMTP não configuradas. Inicializando conta de teste Ethereal...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      return {
        transporter,
        from: '"DevMenthors (Teste)" <noreply@devmenthors.com>',
        isTest: true
      };
    } catch (error) {
      console.warn('[EmailService] Não foi possível criar conta Ethereal (sem conexão?). Fallback para log simples no console.');
      return {
        transporter: null,
        from: '"DevMenthors" <noreply@devmenthors.com>',
        isTest: true
      };
    }
  }

  /**
   * Envia as credenciais de acesso para um usuário recém-criado.
   */
  static async sendCredentials({ name, email, password, role }) {
    const roleLabel = role === 'ADMIN' ? 'Administrador' : role === 'DEV' ? 'Mentor' : 'Jurado';
    
    // Obter o logo do DevMenthors
    let logoPath = path.join(__dirname, '../assets/devmenthors_LogoColor.png');
    let hasLogo = fs.existsSync(logoPath);

    // Se o logo não existir no backend, tenta procurar na pasta do frontend como último recurso
    if (!hasLogo) {
      const fallbackLogoPath = path.join(__dirname, '../../../../front-hackathon/src/assets/devmenthors_LogoColor.png');
      if (fs.existsSync(fallbackLogoPath)) {
        logoPath = fallbackLogoPath;
        hasLogo = true;
      }
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acesso ao Painel de Votação - Hackathon DevMenthors</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f5f7;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #1f2937;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f5f7;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border: 1px solid #e5e7eb;
    }
    .header {
      background-color: #ffffff;
      padding: 32px;
      text-align: center;
      border-bottom: 4px solid #6366f1;
    }
    .header img {
      height: 64px;
      margin-bottom: 12px;
    }
    .header h1 {
      margin: 0;
      color: #0f172a;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 40px 32px;
    }
    .welcome-text {
      font-size: 18px;
      line-height: 1.6;
      color: #111827;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .welcome-text strong {
      color: #6366f1;
    }
    .info-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .info-row {
      margin-bottom: 16px;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .info-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 16px;
      color: #0f172a;
      font-weight: 600;
      word-break: break-all;
    }
    .info-value-mono {
      font-family: 'Courier New', Courier, monospace;
      font-size: 18px;
      color: #4f46e5;
      font-weight: 700;
      background-color: #e0e7ff;
      padding: 4px 8px;
      border-radius: 6px;
      display: inline-block;
    }
    .btn-container {
      text-align: center;
      margin-bottom: 32px;
    }
    .btn {
      display: inline-block;
      background-color: #6366f1;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 0;
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
    }
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        ${hasLogo ? '<img src="cid:logo" alt="DevMenthors Logo">' : ''}
        <h1>Hackathon DevMenthors</h1>
      </div>
      <div class="content">
        <p class="welcome-text">Olá, <strong>${name}</strong>!</p>
        <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
          Você foi cadastrado com sucesso na plataforma do <strong>Hackathon DevMenthors</strong>. 
          Abaixo estão os seus dados de acesso para entrar e realizar a avaliação dos projetos do Hackathon.
        </p>
        
        <div class="info-card">
          <div class="info-row">
            <div class="info-label">Link de Acesso</div>
            <div class="info-value"><a href="https://avaliacao.devmenthors.com/vote" style="color: #6366f1; text-decoration: underline; font-weight: bold;">avaliacao.devmenthors.com/vote</a></div>
          </div>
          <div class="info-row">
            <div class="info-label">E-mail</div>
            <div class="info-value">${email}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Senha Temporária</div>
            <div class="info-value"><span class="info-value-mono">${password}</span></div>
          </div>
          <div class="info-row">
            <div class="info-label">Função / Perfil</div>
            <div class="info-value">${roleLabel}</div>
          </div>
        </div>

        <div class="btn-container">
          <a href="https://avaliacao.devmenthors.com/vote" class="btn" target="_blank" style="color: #ffffff !important;">Acessar Painel de Votação</a>
        </div>

        <p style="font-size: 13px; color: #9ca3af; line-height: 1.5; margin: 0; text-align: center;">
          Guarde estas credenciais com segurança. Nos vemos nas avaliações do evento!
        </p>
      </div>
      <div class="footer">
        <p>Este é um e-mail automático enviado pela Plataforma DevMenthors.</p>
        <p style="margin-top: 8px;">&copy; 2026 <a href="https://devmenthors.com.br" target="_blank">DevMenthors</a>. Todos os direitos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const { transporter, from, isTest } = await this.getTransporter();

    const mailOptions = {
      from,
      to: email,
      subject: 'Acesso ao Painel de Votação - DevMenthors',
      html: htmlContent,
      attachments: hasLogo ? [
        {
          filename: 'devmenthors_logo.png',
          path: logoPath,
          cid: 'logo'
        }
      ] : []
    };

    if (!transporter) {
      // Fallback extremo: Exibe no console o e-mail completo
      console.log('========================================================================');
      console.log(`[EmailService LOG FALLBACK] Enviando e-mail para: ${email}`);
      console.log(`Assunto: ${mailOptions.subject}`);
      console.log(`Nome: ${name} | Usuário: ${email} | Senha: ${password} | Função: ${roleLabel}`);
      console.log('========================================================================');
      return { success: true, loggedConsole: true };
    }

    const info = await transporter.sendMail(mailOptions);

    if (isTest) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('\n========================================================================');
      console.log(`[EmailService TEST] E-mail de teste enviado para: ${email}`);
      console.log(`[EmailService TEST] Link para visualizar o e-mail formatado:`);
      console.log(`\x1b[36m${previewUrl}\x1b[0m`);
      console.log('========================================================================\n');
      return { success: true, testPreviewUrl: previewUrl };
    }

    console.log(`[EmailService] E-mail enviado com sucesso para ${email}`);
    return { success: true };
  }

  /**
   * Envia o e-mail oficial de notificação para a equipe vencedora do Hackathon.
   */
  static async sendWinnerEmail({ leaderEmail, projectName, position, teamMembers = [], customMessage = '' }) {
    const trophyColor = '#6366f1';

    const emailSubject = `Parabens! O projeto ${projectName} esta entre os 3 finalistas do Hackathon DevMenthors`;
    const emailTitle = `Seu projeto esta entre os finalistas!`;

    const introText = `É com imensa alegria e orgulho que a comissão organizadora comunica que o seu projeto, <strong>${projectName}</strong>, conquistou uma posição de destaque e está entre os 3 grandes finalistas do Hackathon DevMenthors!<br><br>Entre diversos projetos de altíssimo nível desenvolvidos no evento, a sua equipe demonstrou um nível excepcional de dedicação, criatividade e domínio técnico, destacando-se merecidamente entre os melhores.`;

    const closingText = `Parabens de verdade por toda a dedicacao e pelo trabalho fantastico que vocês entregaram. Agradecemos muito a energia e a participacao de cada um de vocês!<br><br>Lembrando que a divulgação dos lugares e a premiação oficial acontecerão no dia 08/08 às 9hs na Unimar.`;

    let logoPath = path.join(__dirname, '../assets/devmenthors_LogoColor.png');
    let hasLogo = fs.existsSync(logoPath);
    if (!hasLogo) {
      const fallbackLogoPath = path.join(__dirname, '../../../../front-hackathon/src/assets/devmenthors_LogoColor.png');
      if (fs.existsSync(fallbackLogoPath)) {
        logoPath = fallbackLogoPath;
        hasLogo = true;
      }
    }

    const membersList = Array.isArray(teamMembers) && teamMembers.length > 0
      ? teamMembers.map(m => typeof m === 'string' ? m : m.name).join(', ')
      : '';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailTitle}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f5f7; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; background-color: #f4f5f7; padding: 40px 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb; }
    .header { background-color: #ffffff; padding: 32px; text-align: center; border-bottom: 4px solid ${trophyColor}; }
    .header img { height: 64px; margin-bottom: 12px; }
    .header h1 { margin: 0; color: #0f172a; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 40px 32px; text-align: center; }
    .trophy-badge { display: inline-block; background-color: #f1f5f9; color: #334155; padding: 8px 20px; border-radius: 9999px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; }
    .welcome-text { font-size: 22px; line-height: 1.4; color: #111827; margin-top: 0; margin-bottom: 16px; font-weight: 800; }
    .footer { background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { margin: 0; font-size: 13px; color: #64748b; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        ${hasLogo ? '<img src="cid:logo" alt="DevMenthors Logo">' : ''}
        <h1>Hackathon DevMenthors</h1>
      </div>
      <div class="content">
        <div class="trophy-badge">Finalista do Hackathon</div>
        <h2 class="welcome-text">${emailTitle}</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 28px; text-align: left;">
          ${introText}
        </p>

        ${customMessage ? `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: left;">
          <div style="font-size: 12px; text-transform: uppercase; color: #166534; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.05em;">Recado da Comissão Organizadora</div>
          <div style="font-size: 15px; color: #14532d; line-height: 1.6; white-space: pre-wrap; font-weight: 500;">${customMessage}</div>
        </div>
        ` : ''}

        <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0; text-align: left;">
          ${closingText}
        </p>
      </div>
      <div class="footer">
        <p>&copy; 2026 <a href="https://devmenthors.com.br" target="_blank" style="color: #6366f1; text-decoration: none;">DevMenthors</a>. Todos os direitos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const { transporter, from, isTest } = await this.getTransporter();

    const mailOptions = {
      from,
      to: leaderEmail,
      subject: emailSubject,
      html: htmlContent,
      attachments: hasLogo ? [
        {
          filename: 'devmenthors_logo.png',
          path: logoPath,
          cid: 'logo'
        }
      ] : []
    };

    if (!transporter) {
      console.log('========================================================================');
      console.log(`[EmailService WINNER LOG] Enviando e-mail de vencedor para: ${leaderEmail}`);
      console.log(`Projeto: ${projectName} | Posição: ${posText}`);
      console.log('========================================================================');
      return { success: true, loggedConsole: true };
    }

    const info = await transporter.sendMail(mailOptions);

    if (isTest) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('\n========================================================================');
      console.log(`[EmailService WINNER TEST] E-mail enviado para: ${leaderEmail}`);
      console.log(`[EmailService WINNER TEST] Link: \x1b[36m${previewUrl}\x1b[0m`);
      console.log('========================================================================\n');
      return { success: true, testPreviewUrl: previewUrl };
    }

    console.log(`[EmailService] E-mail de vencedor enviado com sucesso para ${leaderEmail}`);
    return { success: true };
  }
}
