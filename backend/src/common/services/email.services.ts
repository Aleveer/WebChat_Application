import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CircuitBreaker } from '../utils/circuit-breaker';

// Email Service with Circuit Breaker pattern
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly circuitBreaker: CircuitBreaker;

  constructor(private configService: ConfigService) {
    // Initialize circuit breaker for email service
    this.circuitBreaker = new CircuitBreaker('email-service', {
      failureThreshold: 3, // Open after 3 failures
      successThreshold: 2, // Close after 2 successes
      timeout: 30000, // Try again after 30 seconds
      monitoringPeriod: 60000, // Reset failure count after 1 minute
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    content: string,
  ): Promise<boolean> {
    // Use circuit breaker with fallback
    return this.circuitBreaker.executeWithFallback(
      async () => {
        // Actual email sending logic
        const emailConfig = {
          host: this.configService.get('EMAIL_HOST'),
          port: this.configService.get('EMAIL_PORT'),
          secure: this.configService.get('EMAIL_SECURE'),
          auth: {
            user: this.configService.get('EMAIL_USER'),
            pass: this.configService.get('EMAIL_PASS'),
          },
        };

        // TODO: Implement real email service (Nodemailer, SendGrid, etc.)
        // Mock implementation - replace with actual email sending
        // LOGGING FIX: Add structured logging with context
        this.logger.log({
          message: 'Email sent successfully',
          to,
          subject,
          timestamp: new Date().toISOString(),
          service: 'email',
        });

        return true;
      },
      // Fallback: Log email instead of sending (graceful degradation)
      async () => {
        // LOGGING FIX: Structured error logging
        this.logger.warn({
          message: 'Email service unavailable - using fallback',
          to,
          subject,
          timestamp: new Date().toISOString(),
          service: 'email',
          fallback: true,
        });

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
      <h1>Welcome ${userName}!</h1>
      <p>Thank you for joining WebChat. We're excited to have you on board!</p>
      <p>Best regards,<br>The WebChat Team</p>
    `;
    return this.sendEmail(userEmail, subject, content);
  }

  async sendPasswordResetEmail(
    userEmail: string,
    resetToken: string,
  ): Promise<boolean> {
    const subject = 'Password Reset Request';
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    const content = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;
    return this.sendEmail(userEmail, subject, content);
  }

  async sendNotificationEmail(to: string, message: string): Promise<boolean> {
    const subject = 'New Message Notification';
    const content = `
      <h1>New Message</h1>
      <p>You have a new message:</p>
      <p>${message}</p>
    `;
    return this.sendEmail(to, subject, content);
  }
}
