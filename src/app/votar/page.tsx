"use client";

import { useState, useEffect } from "react";
import {
  getCandidatos,
  votarPorCandidato,
  comprobarVoto,
} from "@/services/api";
import { Candidato } from "@/types";
import { Auth } from "@/lib/auth";
import withAuth from "@/components/auth/with-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { TarjetaCandidato } from "@/components/votacion/tarjeta-candidato";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

function PaginaVotacion() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);
  const [votando, setVotando] = useState(false);
  const [yaVoto, setYaVoto] = useState(false);
  const [candidatoVotado, setCandidatoVotado] = useState<Candidato | null>(
    null
  );
  const [fechaVoto, setFechaVoto] = useState<string | null>(null);
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState<
    number | null
  >(null);
  const usuario = Auth.getUser();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Comprobar si el usuario ya votó
        const infoVoto = await comprobarVoto();

        if (infoVoto.success && infoVoto.data) {
          setYaVoto(infoVoto.data.haVotado);

          if (infoVoto.data.haVotado && infoVoto.data.candidato) {
            setCandidatoVotado(infoVoto.data.candidato);

            // Formatear la fecha de votación
            if (infoVoto.data.voto?.fechaVoto) {
              const fecha = new Date(infoVoto.data.voto.fechaVoto);
              setFechaVoto(
                formatDistanceToNow(fecha, { addSuffix: true, locale: es })
              );
            }
          }
        }

        // Cargar la lista de candidatos
        const datosCandidatos = await getCandidatos();
        setCandidatos(datosCandidatos);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast.error("Error al cargar los datos. Inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const handleSeleccionCandidato = (candidatoId: number) => {
    setCandidatoSeleccionado(candidatoId);
  };

  const handleVotar = async () => {
    if (!candidatoSeleccionado) {
      toast.error("Debes seleccionar un candidato para votar");
      return;
    }

    try {
      setVotando(true);
      const resultado = await votarPorCandidato(candidatoSeleccionado);
      if (!resultado.success) {
        toast.error(resultado.error || "Ocurrió un error al procesar tu voto");
        return;
      }

      // Buscar información del candidato votado
      const candidatoInfo = candidatos.find(
        (c) => c.id === candidatoSeleccionado
      );
      if (candidatoInfo) {
        setCandidatoVotado(candidatoInfo);
        setFechaVoto("hace un momento");
      }

      setYaVoto(true);
      toast.success(resultado.message ?? "Voto registrado con éxito");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Ocurrió un error al procesar tu voto");
      }
    } finally {
      setVotando(false);
    }
  };

  const handleCerrarSesion = () => {
    Auth.logout();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2">Cargando candidatos...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Votación AMCE</h1>
        <div className="flex items-center gap-4 flex-wrap justify-end">
          <div className="text-right">
            <p className="font-medium">{usuario?.nombre}</p>
            <p className="text-sm text-muted-foreground">
              {usuario?.membresiaNombre}
            </p>
          </div>
          <Button variant="outline" onClick={handleCerrarSesion}>
            Cerrar sesión
          </Button>
        </div>
      </div>

      {yaVoto ? (
        <div className="mb-8">
          <div className="p-6 bg-green-50 rounded-lg border border-green-200 mb-6">
            <h2 className="text-xl font-semibold text-green-800 mb-2">
              ¡Tu voto ha sido registrado!
            </h2>
            <p className="text-green-700">
              {fechaVoto ? (
                <>Has votado {fechaVoto}.</>
              ) : (
                <>Tu voto ha sido procesado correctamente.</>
              )}
            </p>
          </div>

          {candidatoVotado && (
            <div className="bg-card border rounded-lg overflow-hidden">
              <h2 className="text-xl font-semibold p-4 bg-muted/50">
                Candidato elegido
              </h2>
              <div className="p-6 flex flex-col md:flex-row gap-6">
                {candidatoVotado.imagenS3Llave && (
                  <div className="w-full md:w-1/3 flex justify-center">
                    <Image
                      src={candidatoVotado.imagenS3Llave}
                      alt={candidatoVotado.nombre}
                      width={240}
                      height={320}
                      className="object-contain rounded-md"
                    />
                  </div>
                )}
                <div className="w-full md:w-2/3">
                  <h3 className="text-2xl font-bold mb-2">
                    {candidatoVotado.nombre}
                  </h3>
                  {candidatoVotado.descripcion && (
                    <p className="text-muted-foreground mb-4">
                      {candidatoVotado.descripcion}
                    </p>
                  )}
                  {candidatoVotado.propuesta && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Propuesta:</h4>
                      <p className="whitespace-pre-line">
                        {candidatoVotado.propuesta}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Selecciona un candidato para votar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidatos.map((candidato) => (
              <TarjetaCandidato
                key={candidato.id}
                candidato={candidato}
                seleccionado={candidato.id === candidatoSeleccionado}
                onSeleccionar={handleSeleccionCandidato}
                disabled={votando}
              />
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              onClick={handleVotar}
              disabled={!candidatoSeleccionado || votando}
              className="w-full max-w-md"
            >
              {votando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar voto"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(PaginaVotacion);
