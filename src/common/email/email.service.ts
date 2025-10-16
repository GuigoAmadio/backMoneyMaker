import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailUser = this.configService.get('EMAIL_USER');
    const emailPass = this.configService.get('EMAIL_PASSWORD');
    const emailHost = this.configService.get('EMAIL_HOST') || 'smtp.gmail.com';
    const emailPort = parseInt(this.configService.get('EMAIL_PORT')) || 587;

    if (!emailUser || !emailPass) {
      this.logger.warn('⚠️ Email credentials not configured. Email sending will fail.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    this.logger.log(`✅ Email service initialized with host: ${emailHost}`);
  }

  /**
   * Enviar email de verificação
   */
  async sendVerificationEmail(email: string, token: string, name: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3001';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"UltraDashboard" <${this.configService.get('EMAIL_USER')}>`,
      to: email,
      subject: 'Verificação de Email - UltraDashboard',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Olá, ${name}!</h1>
          <p style="color: #666; font-size: 16px;">
            Obrigado por se registrar no UltraDashboard. Por favor, clique no botão abaixo para verificar seu email:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verificar Email
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            Ou copie e cole este link no seu navegador:<br>
            <a href="${verificationUrl}">${verificationUrl}</a>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Se você não se registrou no UltraDashboard, ignore este email.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`❌ Error sending verification email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Enviar email de recuperação de senha
   */
  async sendPasswordResetEmail(email: string, token: string, name: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3001';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"UltraDashboard" <${this.configService.get('EMAIL_USER')}>`,
      to: email,
      subject: 'Recuperação de Senha - UltraDashboard',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Olá, ${name}!</h1>
          <p style="color: #666; font-size: 16px;">
            Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Redefinir Senha
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            Ou copie e cole este link no seu navegador:<br>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
          <p style="color: #FF6B6B; font-size: 14px; margin-top: 20px;">
            <strong>Este link expira em 1 hora.</strong>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Se você não solicitou a recuperação de senha, ignore este email e sua senha permanecerá inalterada.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`❌ Error sending password reset email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Enviar email genérico
   */
  async sendEmail(to: string, subject: string, html: string) {
    const mailOptions = {
      from: `"UltraDashboard" <${this.configService.get('EMAIL_USER')}>`,
      to,
      subject,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Error sending email to ${to}:`, error);
      throw error;
    }
  }
}
