export interface IEmailService {
  sendEmail(to: string, subject: string, content: string): Promise<boolean>;
  sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean>;
  sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<boolean>;
  sendNotificationEmail(to: string, message: string): Promise<boolean>;
}
