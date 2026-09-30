import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().min(2).max(120),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
