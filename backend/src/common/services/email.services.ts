import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CircuitBreaker } from '../utils/circuit-breaker';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly circuitBreaker: CircuitBreaker;
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.circuitBreaker = new CircuitBreaker('email-service', {
      failureThreshold: 3, // Open after 3 failures
      successThreshold: 2, // Close after 2 successes
      timeout: 30000, // Try again after 30 seconds
      monitoringPeriod: 60000, // Reset failure count after 1 minute
    });

    // Initialize Nodemailer transporter
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailConfig = this.configService.get('app.email');
    let host = emailConfig?.host || this.configService.get('EMAIL_HOST');
    let port = emailConfig?.port || this.configService.get('EMAIL_PORT') || 587;
    const secure =
      emailConfig?.secure ||
      this.configService.get('EMAIL_SECURE') === 'true' ||
      false;
    const user =
      emailConfig?.auth?.user || this.configService.get('EMAIL_USER');
    const pass =
      emailConfig?.auth?.pass || this.configService.get('EMAIL_PASS');

    if (!host || !user || !pass) {
      return;
    }

    // Clean and validate host (remove protocol if present)
    if (host) {
      host = host.toString().trim();
      // Remove http:// or https:// if present
      host = host.replace(/^https?:\/\//i, '');
      // Remove trailing slash
      host = host.replace(/\/$/, '');
    }

    // Clean and validate port
    if (port) {
      const portNum = Number(port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        port = 587;
      } else {
        port = portNum;
      }
    } else {
      port = 587;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: host as string,
        port: port as number,
        secure: secure, // true for 465, false for other ports
        auth: {
          user: user as string,
          pass: pass as string,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      this.transporter.verify();
    } catch (error) {
      throw new Error('Failed to initialize email transporter');
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    content: string,
  ): Promise<boolean> {
    // Use circuit breaker with fallback
    return this.circuitBreaker.executeWithFallback(
      async () => {
        // Check if transporter is initialized
        if (!this.transporter) {
          throw new Error('Email transporter not initialized');
        }

        const emailConfig = this.configService.get('app.email');
        const from =
          emailConfig?.auth?.user ||
          this.configService.get('EMAIL_USER') ||
          'noreply@webchat.com';

        // Send email using Nodemailer
        const info = await this.transporter.sendMail({
          from: `"WebChat" <${from}>`,
          to,
          subject,
          html: content,
          text: content.replace(/<[^>]*>/g, ''),
        });

        return true;
      },
      // Fallback: graceful degradation
      async () => {
        // Return false to indicate fallback was used
        return false;
      },
    );
  }

  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
  ): Promise<boolean> {
    const subject = 'Welcome to WebChat!';
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to WebChat!</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Thank you for joining WebChat. We're excited to have you on board!</p>
            <p>You can now start chatting with your friends and colleagues.</p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br><strong>The WebChat Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail(userEmail, subject, content);
  }

  async sendPasswordResetEmail(
    userEmail: string,
    resetToken: string,
  ): Promise<boolean> {
    const subject = 'Password Reset Request - WebChat';
    const resetUrl = `https://webchat.mom/reset-password?token=${resetToken}`;
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          .token { background-color: #F3F4F6; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>You requested a password reset for your WebChat account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <div class="token">${resetUrl}</div>
            <div class="warning">
              <strong>⚠️ Important:</strong> This link will expire in <strong>15 minutes</strong>.
            </div>
            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            <p>For security reasons, never share this link with anyone.</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>If you have concerns, contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail(userEmail, subject, content);
  }

  async sendNotificationEmail(to: string, message: string): Promise<boolean> {
    const subject = 'New Message Notification - WebChat';
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
          .message-box { background-color: white; padding: 20px; border-left: 4px solid #10B981; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Message Notification</h1>
          </div>
          <div class="content">
            <p>You have a new message in WebChat:</p>
            <div class="message-box">
              <p>${message}</p>
            </div>
            <p>Log in to WebChat to view and reply to this message.</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail(to, subject, content);
  }
}
