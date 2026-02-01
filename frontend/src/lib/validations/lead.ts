import * as z from "zod";
import type { LeadSource, LeadPriority, LeadActivityType } from "@/types/lead";

export const createLeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  source: z.enum([
    "REFERRAL",
    "WALK_IN",
    "SOCIAL_MEDIA",
    "PAID_ADS",
    "WEBSITE",
    "PHONE_CALL",
    "EMAIL",
    "PARTNER",
    "EVENT",
    "OTHER",
  ] as const),
  assignedToUserId: z.string().uuid().optional(),
  notes: z.string().max(2000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).optional(),
  expectedConversionDate: z.string().optional(),
  campaignSource: z.string().max(100).optional(),
  campaignMedium: z.string().max(100).optional(),
  campaignName: z.string().max(100).optional(),
});

export const updateLeadSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  source: z.enum([
    "REFERRAL",
    "WALK_IN",
    "SOCIAL_MEDIA",
    "PAID_ADS",
    "WEBSITE",
    "PHONE_CALL",
    "EMAIL",
    "PARTNER",
    "EVENT",
    "OTHER",
  ] as const).optional(),
  assignedToUserId: z.string().uuid().optional(),
  notes: z.string().max(2000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).optional(),
  expectedConversionDate: z.string().optional(),
});

export const logActivitySchema = z.object({
  type: z.enum([
    "CALL",
    "EMAIL",
    "SMS",
    "WHATSAPP",
    "MEETING",
    "TOUR",
    "NOTE",
    "STATUS_CHANGE",
    "ASSIGNMENT",
    "FOLLOW_UP_SCHEDULED",
    "FOLLOW_UP_COMPLETED",
  ] as const),
  notes: z.string().max(2000).optional(),
  contactMethod: z.string().max(50).optional(),
  outcome: z.string().max(500).optional(),
  followUpDate: z.string().optional(),
  durationMinutes: z.number().int().min(0).max(480).optional(),
});

export const bulkAssignSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1, "Select at least one lead"),
  assignToUserId: z.string().uuid("Select a user to assign"),
});

export const markLeadLostSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const convertLeadSchema = z.object({
  memberId: z.string().uuid("Member ID is required"),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LogActivityInput = z.infer<typeof logActivitySchema>;
export type BulkAssignInput = z.infer<typeof bulkAssignSchema>;
export type MarkLeadLostInput = z.infer<typeof markLeadLostSchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
