import z from "zod";

export const resetPasswordSchema = z
  .object({
    otp: z.string().length(6, "Informe o código de 6 dígitos"),
    password: z
      .string()
      .min(8, "A senha precisa ter no mínimo 8 caracteres"),
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "As senhas não coincidem",
    path: ["password_confirm"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;