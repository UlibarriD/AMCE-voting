"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { LoginFormValues, loginSchema } from "@/lib/validations/auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rfc: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch("https://www.amce.org.mx/api/token2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rfc: data.rfc }),
      });

      const responseData = await response.json();

      if (responseData.success) {
        // Guardar token y datos del usuario en sessionStorage
        sessionStorage.setItem("auth-token", responseData.token);
        sessionStorage.setItem("user-data", JSON.stringify(responseData.user));

        toast.success("Autenticación exitosa");

        // Redirigir según el rol del usuario
        if (responseData.user.membresia === 2) {
          // Usuario administrador
          router.push("/admin/estadisticas");
        } else {
          // Usuario normal
          router.push("/votar");
        }
      } else {
        toast.error(responseData.error ?? "Error en la autenticación");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
        toast.error(error.message);
      } else {
        console.error("Ha ocurrido un error durante la autenticación");
        toast.error("Ha ocurrido un error durante la autenticación");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center text-primary">
          AMCE Votaciones
        </CardTitle>
        <CardDescription className="text-center">
          Ingresa tu RFC para iniciar sesión
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rfc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RFC</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ingresa tu RFC"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
