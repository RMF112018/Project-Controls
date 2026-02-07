import { NotificationType } from './enums';

export interface INotification {
  id: string;
  type: NotificationType;
  subject: string;
  body: string;
  recipients: string[];
  sentAt: string;
  sentBy: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  projectCode?: string;
  status: 'sent' | 'failed' | 'pending';
}
