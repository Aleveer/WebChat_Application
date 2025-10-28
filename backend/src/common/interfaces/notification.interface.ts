export interface INotificationService {
  sendNotification(
    userId: string,
    title: string,
    message: string,
    type?: 'info' | 'warning' | 'error' | 'success',
  ): Promise<boolean>;
  sendMessageNotification(
    userId: string,
    senderName: string,
    messagePreview: string,
  ): Promise<boolean>;
  sendGroupNotification(
    userId: string,
    groupName: string,
    messagePreview: string,
  ): Promise<boolean>;
}
