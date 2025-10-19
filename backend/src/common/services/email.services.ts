import { Injectable, Logger } from '@nestjs/common';

//TODO: Implement actual email service
// Email Service (Mock implementation)
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendEmail(
    to: string,
    subject: string,
    content: string,
  ): Promise<boolean> {
    try {
      // Mock email sending - replace with actual email service
      this.logger.log(`Sending email to ${to}: ${subject}`);

      // Simulate email sending delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
  ): Promise<boolean> {
    const subject = 'Welcome to WebChat!';
    const content = `
      <h1>Welcome ${userName}!</h1>
      <p>Thank you for joining WebChat. You can now start chatting with your friends!</p>
    `;

    return this.sendEmail(userEmail, subject, content);
  }

  async sendPasswordResetEmail(
    userEmail: string,
    resetToken: string,
  ): Promise<boolean> {
    const subject = 'Password Reset Request';
    const content = `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
    `;

    return this.sendEmail(userEmail, subject, content);
  }
}
