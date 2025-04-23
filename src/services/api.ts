import { Candidato, EstadisticasVotacion, ComprobarVotoResponse, ListaVotantesResponse } from "@/types";

const BASE_URL = "http://localhost:3000/api/votacion";

// Función para obtener el token del sessionStorage
const getToken = () => {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("auth-token");
  }
  return null;
};

// Función genérica para hacer fetches con autorización
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("No hay token de autenticación");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message ?? "Error en la petición");
  }

  return response.json();
}

// Obtener todos los candidatos activos
export async function getCandidatos(): Promise<Candidato[]> {
  const response = await fetchWithAuth("/candidatos");
  // Comprobar si la respuesta tiene la estructura esperada y extraer el array de datos
  if (response.success && Array.isArray(response.data)) {
    return response.data;
  } else if (Array.isArray(response)) {
    return response;
  } else {
    console.error("Formato de respuesta inválido:", response);
    throw new Error("El formato de respuesta no es válido");
  }
}

// Comprobar si el usuario ha votado y obtener info del voto
export async function comprobarVoto(): Promise<ComprobarVotoResponse> {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("No se encontró token de autenticación");
    }

    const response = await fetch(`${BASE_URL}/voto-usuario`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al comprobar voto:", error);
    return {
      success: false,
      data: null,
      error: "Error al comprobar voto",
    };
  }
}

// Obtener la lista de votantes (solo para administradores)
export async function getListaVotantes(): Promise<ListaVotantesResponse> {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("No se encontró token de autenticación");
    }

    const response = await fetch(`${BASE_URL}/lista-votantes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const responseData = await response.json();
    
    if (!responseData.success) {
      throw new Error(responseData.error || 'Error al obtener lista de votantes');
    }
    
    return responseData;
  } catch (error) {
    console.error('Error al obtener lista de votantes:', error);
    return {
      success: false,
      data: null,
      error: 'No se pudo cargar la lista de votantes',
    };
  }
}

// Votar por un candidato
export async function votarPorCandidato(
  candidatoId: number
): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetchWithAuth("/votar", {
    method: "POST",
    body: JSON.stringify({ candidatoId }),
  });
  return response;
}

// Obtener estadísticas de votación (solo para admins)
export async function getEstadisticas(): Promise<EstadisticasVotacion> {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("No se encontró token de autenticación");
    }

    const response = await fetch(`${BASE_URL}/resultados`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const responseData = await response.json();
    
    if (!responseData.success) {
      throw new Error(responseData.error || 'Error al obtener estadísticas');
    }
    
    return responseData.data as EstadisticasVotacion;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw new Error('No se pudieron cargar las estadísticas');
  }
}
