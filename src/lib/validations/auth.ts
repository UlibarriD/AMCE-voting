import * as z from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, { message: "El usuario es requerido" }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
