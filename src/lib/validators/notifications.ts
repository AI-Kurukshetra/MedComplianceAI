import { z } from "zod";

export const NotificationReadSchema = z.object({
  id: z.string().uuid(),
});
