import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// IP autorizada (reemplaza esto con la IP que quieres permitir)
const ALLOWED_IP = "201.138.6.68";

export function middleware(request: NextRequest) {
  // Obtenemos la IP del cliente desde los headers
  const forwarded = request.headers.get("x-forwarded-for");
  const clientIp = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  // Si la IP no está permitida, redirigimos a una página de acceso denegado
  if (clientIp !== ALLOWED_IP) {
    return NextResponse.redirect(new URL("/acceso-denegado", request.url));
  }

  // Si la IP está permitida, permitimos el acceso
  return NextResponse.next();
}

// Configuración del middleware para ejecutarse en todas las rutas
export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
};
