import { Candidato } from "@/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { CheckCircle } from "lucide-react";

interface TarjetaCandidatoProps {
  candidato: Candidato;
  seleccionado: boolean;
  onSeleccionar: (candidatoId: number) => void;
  disabled?: boolean;
}

export function TarjetaCandidato({
  candidato,
  seleccionado,
  onSeleccionar,
  disabled = false,
}: TarjetaCandidatoProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all cursor-pointer hover:shadow-md",
        {
          "ring-2 ring-primary border-primary": seleccionado,
          "opacity-75 cursor-not-allowed": disabled,
        }
      )}
      onClick={() => !disabled && onSeleccionar(candidato.id)}
    >
      <div className="relative w-full bg-muted">
        <Image
          src={candidato.imagenS3Llave!}
          alt={candidato.nombre}
          priority
          width={354}
          height={472}
          className="object-cover h-[472px] w-[354px]"
        />
      </div>

      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-1">{candidato.nombre}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {candidato.descripcion}
        </p>

        {seleccionado && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
            <CheckCircle className="h-4 w-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
