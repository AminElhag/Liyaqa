import { z } from "zod";

export const updateClientSchema = z.object({
  goalsEn: z.string().max(1000).optional(),
  goalsAr: z.string().max(1000).optional(),
  notesEn: z.string().max(2000).optional(),
  notesAr: z.string().max(2000).optional(),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "INACTIVE"]),
});

export type UpdateClientFormValues = z.infer<typeof updateClientSchema>;
