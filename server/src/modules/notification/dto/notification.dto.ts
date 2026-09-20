import { NotificationType } from '../enums/notification-type.enum';

/** Wire shape for both REST responses and the `notification` socket event. */
export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  count: number;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
