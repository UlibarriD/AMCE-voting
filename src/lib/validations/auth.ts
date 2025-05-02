import * as z from "zod";

export const loginSchema = z.object({
  rfc: z.string().min(1, { message: "El RFC es requerido" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
