"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@/lib/auth";
import { toast } from "sonner";

export type ProtectedRouteProps = {
  adminOnly?: boolean;
};

export default function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  { adminOnly = false }: ProtectedRouteProps = {}
) {
  return function ProtectedRoute(props: P) {
    const router = useRouter();

    useEffect(() => {
      // Comprobar si el usuario está autenticado
      if (!Auth.isAuthenticated()) {
        toast.error("Debes iniciar sesiu00f3n para acceder a esta pu00e1gina");
        router.replace("/");
        return;
      }

      // Si la ruta es solo para administradores, comprobar el rol
      if (adminOnly && !Auth.isAdmin()) {
        toast.error("No tienes permisos para acceder a esta pu00e1gina");
        router.replace("/votar");
        return;
      }
    }, [router]);

    // Si estamos en el cliente y el usuario no está autenticado, no renderizar el componente
    if (typeof window !== "undefined" && !Auth.isAuthenticated()) {
      return null;
    }

    // Si la ruta es solo para administradores y el usuario no es administrador, no renderizar el componente
    if (typeof window !== "undefined" && adminOnly && !Auth.isAdmin()) {
      return null;
    }

    // Si todo está bien, renderizar el componente
    return <Component {...props} />;
  };
}
