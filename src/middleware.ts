import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rango de IPs de la red WiFi (formato CIDR)
// Este rango cubre la red WiFi actual del usuario
const ALLOWED_IP_RANGE = "172.20.10.0/28";

// Función para verificar si una IP está dentro de un rango CIDR
function isIpInRange(ip: string, cidr: string): boolean {
  // Para IPs desconocidas, permitir en desarrollo
  if (ip === "unknown") {
    return process.env.NODE_ENV === "development";
  }

  try {
    // Dividir el CIDR en la dirección IP y la máscara
    const [rangePart, maskPart] = cidr.split("/");
    const maskBits = parseInt(maskPart);

    // Convertir la dirección IP a un número
    function ipToLong(ipStr: string): number {
      return ipStr.split(".").reduce((total, part, i) => {
        return total + parseInt(part) * Math.pow(256, 3 - i);
      }, 0);
    }

    // Calcular la máscara de red
    const mask = ~((1 << (32 - maskBits)) - 1);

    // Convertir las IPs a números
    const rangeIpLong = ipToLong(rangePart);
    const ipLong = ipToLong(ip);

    // Verificar si la IP está en el rango
    return (ipLong & mask) === (rangeIpLong & mask);
  } catch (error) {
    console.error("Error al verificar IP:", error);
    return false;
  }
}

export function middleware(request: NextRequest) {
  // Obtenemos la IP del cliente desde los headers
  const forwarded = request.headers.get("x-forwarded-for");
  const clientIp = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  // Log para depuración
  console.log("IP detectada:", clientIp);

  // Permitir acceso en desarrollo local
  const isDev = process.env.NODE_ENV === "development";
  if (
    isDev &&
    (clientIp === "127.0.0.1" || clientIp === "::1" || clientIp === "unknown")
  ) {
    return NextResponse.next();
  }

  // Verificar si la IP está en el rango permitido
  if (isIpInRange(clientIp, ALLOWED_IP_RANGE)) {
    return NextResponse.next();
  }

  // Si la IP no está permitida, redirigimos a la página de acceso denegado
  return NextResponse.redirect(new URL("/acceso-denegado", request.url));
}

// Configuración del middleware para ejecutarse en todas las rutas
export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
};
