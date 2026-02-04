import { z } from "zod";

const timeSlotSchema = z.object({
  start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
  end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
}).refine(
  (data) => {
    // Ensure end time is after start time
    const [startHour, startMin] = data.start.split(":").map(Number);
    const [endHour, endMin] = data.end.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes > startMinutes;
  },
  {
    message: "End time must be after start time",
  }
);

export const availabilitySchema = z.object({
  monday: z.array(timeSlotSchema).optional(),
  tuesday: z.array(timeSlotSchema).optional(),
  wednesday: z.array(timeSlotSchema).optional(),
  thursday: z.array(timeSlotSchema).optional(),
  friday: z.array(timeSlotSchema).optional(),
  saturday: z.array(timeSlotSchema).optional(),
  sunday: z.array(timeSlotSchema).optional(),
});

export type AvailabilityFormValues = z.infer<typeof availabilitySchema>;
export type TimeSlotFormValue = z.infer<typeof timeSlotSchema>;
