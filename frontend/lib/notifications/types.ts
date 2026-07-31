export interface UserNotification {
  id: string;
  notificationType: string;
  title: string;
  message: string;
  workstreamSlug: string | null;
  sectionId: string | null;
  targetRoute: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsListResponse {
  notifications: UserNotification[];
  unreadCount: number;
}

export interface SaveAcknowledgement {
  message: string;
  savedAt: string;
}

export interface MarkAllReadResponse {
  updatedCount: number;
}
