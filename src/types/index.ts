// Tipos para el sistema de votaciones

// Tipo de usuario que devuelve la API en el login
export interface Usuario {
  id: number;
  rfc: string;
  nombre: string;
  correoElectronico: string;
  membresia: number;
  membresiaNombre: string;
  estatus: string;
}

// Respuesta de la API de autenticación
export interface AuthResponse {
  success: boolean;
  token: string;
  user: Usuario;
}

// Modelo de candidato
export interface Candidato {
  id: number;
  nombre: string;
  descripcion: string | null;
  imagenS3Llave: string | null;
  propuesta: string | null;
  activo: boolean;
  creadoEl?: string;
  actualizadoEl?: string;
  votosCount?: number; // Para estadísticas
}

// Modelo de voto
export interface Voto {
  id: string;
  fechaVoto: string | Date;
}

// Respuesta al comprobar voto del usuario
export interface ComprobarVotoResponse {
  success: boolean;
  data: {
    haVotado: boolean;
    candidato: Candidato | null;
    voto?: Voto;
  } | null;
  error: string | null;
}

// Resultados de votación por candidato
export interface ResultadoCandidato {
  candidatoId: number;
  nombre: string;
  descripcion: string | null;
  imagenS3Llave: string | null;
  votos: number;
  porcentaje: number;
}

// Estadísticas para administradores
export interface EstadisticasVotacion {
  resultados: ResultadoCandidato[];
  totalVotos: number;
}

// Información de un votante
export interface Votante {
  votoId: string;
  fechaVoto: string;
  usuarioId: number;
  nombreCompleto: string;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  rfc: string;
  candidatoId: number;
  candidatoNombre: string;
}

// Respuesta de lista de votantes
export interface ListaVotantesResponse {
  success: boolean;
  data: Votante[] | null;
  error: string | null;
}
