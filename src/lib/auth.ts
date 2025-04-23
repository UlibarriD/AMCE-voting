import { Usuario } from "@/types";

// Clase para manejar la autenticación y autorización
export class Auth {
  static isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!sessionStorage.getItem("auth-token");
  }

  static getToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("auth-token");
  }

  static getUser(): Usuario | null {
    if (typeof window === "undefined") return null;

    const userData = sessionStorage.getItem("user-data");
    if (!userData) return null;

    try {
      return JSON.parse(userData) as Usuario;
    } catch (error) {
      console.error("Error al parsear los datos del usuario", error);
      return null;
    }
  }

  static isAdmin(): boolean {
    const user = this.getUser();
    return !!user && user.membresia === 2;
  }

  static logout(): void {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("auth-token");
    sessionStorage.removeItem("user-data");
    window.location.href = "/";
  }
}
