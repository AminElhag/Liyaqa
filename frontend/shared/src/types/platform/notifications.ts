import type { UUID } from "../api";

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "SYSTEM";

export interface PlatformNotificationItem {
  id: UUID;
  titleEn: string;
  titleAr?: string;
  descriptionEn: string;
  descriptionAr?: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  link?: string;
}
