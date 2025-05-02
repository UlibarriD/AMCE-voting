import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AccesoDenegado() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-3xl font-bold text-primary">Acceso Denegado</h1>
        <p className="text-muted-foreground">
          Lo sentimos, no tienes permiso para acceder a esta aplicación desde tu dirección IP actual.
        </p>
        <p className="text-sm">
          Si crees que esto es un error, por favor contacta al administrador.
        </p>
        <div className="pt-4">
          <Button asChild variant="outline">
            <Link href="/">
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
