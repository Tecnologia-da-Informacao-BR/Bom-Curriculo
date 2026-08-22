import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/schemas/auth/reset-password-schema";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { verifyOtp, resetPassword } from "@/api/auth";
import { getApiErrorMessage } from "@/api/client";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import { ROUTE_LINKS } from "@/constants/RouteLinks";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      await verifyOtp({ otp: data.otp });
      await resetPassword({
        otp: data.otp,
        password: data.password,
        password_confirm: data.password_confirm,
      });
    },
    onSuccess: () => {
      toast.success("Senha redefinida com sucesso!");
      navigate(ROUTE_LINKS.login);
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Código inválido ou expirado. Tente novamente.",
        ),
      );
    },
  });

  function handleSubmitReset(data: ResetPasswordFormData) {
    mutation.mutate(data);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <section className="flex flex-1 items-center justify-center bg-background p-4">
        <div className="w-full max-w-[440px] rounded-xl border border-border bg-card p-8 shadow-2xl sm:p-10">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-secondary/10">
            <KeyRound className="h-8 w-8 text-brand-secondary" />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-foreground lg:text-3xl">
            Redefinir senha
          </h1>

          <p className="mb-8 text-sm text-muted-foreground lg:text-base">
            Informe o código de 6 dígitos recebido por e-mail e sua nova senha.
          </p>

          <form
            onSubmit={handleSubmit(handleSubmitReset)}
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block font-medium text-foreground">
                Código de verificação
              </label>
              <Input
                inputMode="numeric"
                maxLength={6}
                className="h-12 rounded-lg border-input-border-strong text-foreground lg:h-14"
                placeholder="123456"
                {...register("otp")}
              />
              {errors.otp && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.otp.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block font-medium text-foreground">
                Nova senha
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  className="h-12 rounded-lg border-input-border-strong pr-12 text-foreground lg:h-14"
                  placeholder="Mínimo 8 caracteres"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block font-medium text-foreground">
                Confirmar nova senha
              </label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  className="h-12 rounded-lg border-input-border-strong pr-12 text-foreground lg:h-14"
                  placeholder="Repita a nova senha"
                  {...register("password_confirm")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password_confirm && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.password_confirm.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="h-12 w-full gap-2 rounded-lg bg-brand-secondary text-base text-white hover:bg-brand-secondary/90 lg:h-14 lg:text-lg"
            >
              {mutation.isPending ? "Redefinindo..." : "Redefinir senha"}
            </Button>

            <Link
              to={ROUTE_LINKS.login}
              className="flex items-center justify-center gap-2 text-sm font-medium text-brand-secondary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </Link>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}