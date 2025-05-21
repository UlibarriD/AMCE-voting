"use client";

import { useState, useEffect, useRef } from "react";
import { getEstadisticas, getListaVotantes } from "@/services/api";
import { EstadisticasVotacion, Votante } from "@/types";
import { Auth } from "@/lib/auth";
import withAuth from "@/components/auth/with-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Loader2,
  RefreshCw,
  BarChart3,
  Award,
  User,
  UserCheck,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

// Colores para las gráficas
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

function PaginaEstadisticas() {
  const [estadisticas, setEstadisticas] = useState<EstadisticasVotacion | null>(
    null
  );
  const [votantes, setVotantes] = useState<Votante[] | null>(null);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(true);
  const [loadingVotantes, setLoadingVotantes] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  const usuario = Auth.getUser();

  const graficosRef = useRef<HTMLDivElement>(null);
  const graficaBarrasRef = useRef<HTMLDivElement>(null);
  const graficaPieRef = useRef<HTMLDivElement>(null);

  const cargarEstadisticas = async () => {
    try {
      setActualizando(true);
      const datos = await getEstadisticas();
      setEstadisticas(datos);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      toast.error("Error al cargar las estadísticas. Inténtalo de nuevo.");
    } finally {
      setActualizando(false);
      setLoadingEstadisticas(false);
    }
  };

  const cargarVotantes = async () => {
    try {
      const respuesta = await getListaVotantes();
      if (respuesta.success && respuesta.data) {
        setVotantes(respuesta.data);
      } else {
        throw new Error(
          respuesta.error || "Error al cargar la lista de votantes"
        );
      }
    } catch (error) {
      console.error("Error al cargar votantes:", error);
      toast.error("Error al cargar la lista de votantes. Inténtalo de nuevo.");
    } finally {
      setLoadingVotantes(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
    cargarVotantes();
  }, []);

  const handleActualizar = () => {
    setActualizando(true);
    Promise.all([cargarEstadisticas(), cargarVotantes()]).finally(() => {
      setActualizando(false);
      toast.success("Datos actualizados correctamente");
    });
  };

  const handleCerrarSesion = () => {
    Auth.logout();
  };

  // Ordenar candidatos por número de votos (de mayor a menor)
  const resultadosOrdenados = estadisticas?.resultados
    ? [...estadisticas.resultados].sort((a, b) => b.votos - a.votos)
    : [];

  // Obtener el candidato con más votos
  const candidatoGanador = resultadosOrdenados[0] || null;

  // Preparar datos para la gráfica de barras
  const datosBarra = resultadosOrdenados.map((candidato) => ({
    nombre: candidato.nombre.split(" ").slice(-1)[0], // Usar solo el último nombre para la gráfica
    nombreCompleto: candidato.nombre,
    votos: candidato.votos,
    porcentaje: candidato.porcentaje,
  }));

  // Preparar datos para la gráfica circular
  const datosPie = resultadosOrdenados.map((candidato) => ({
    nombre: candidato.nombre.split(" ").slice(-1)[0],
    nombreCompleto: candidato.nombre,
    value: candidato.votos,
    porcentaje: candidato.porcentaje,
  }));

  // Formatear fecha
  const formatearFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      return format(fecha, "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", {
        locale: es,
      });
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return fechaStr;
    }
  };

  // Cálculos para paginación
  const totalPaginas = votantes
    ? Math.ceil(votantes.length / elementosPorPagina)
    : 0;
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const indiceFin = Math.min(
    indiceInicio + elementosPorPagina,
    votantes?.length || 0
  );
  const votantesPaginados = votantes?.slice(indiceInicio, indiceFin) || [];

  // Cambiar de página
  const irAPagina = (numeroPagina: number) => {
    setPaginaActual(numeroPagina);
  };

  const irAPaginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual((prev) => prev - 1);
    }
  };

  const irAPaginaSiguiente = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual((prev) => prev + 1);
    }
  };

  // Generar el reporte PDF
  const generarPDF = async () => {
    if (!estadisticas || !votantes || votantes.length === 0) {
      toast.error("No hay datos suficientes para generar el reporte");
      return;
    }

    try {
      setGenerandoPDF(true);
      toast.info("Generando reporte PDF, por favor espere...");

      // Crear documento PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Título principal
      doc.setFontSize(18);
      doc.setTextColor(35, 87, 137);
      doc.text("Reporte de Votación AMCE", 105, 15, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Generado el ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
        105,
        22,
        {
          align: "center",
        }
      );

      // Resumen de votos
      doc.setFontSize(16);
      doc.setTextColor(35, 87, 137);
      doc.text("Resumen General", 15, 35);

      // Tabla de resumen
      autoTable(doc, {
        startY: 40,
        head: [["Total de Votos", "Candidato Liderando", "Porcentaje"]],
        body: [
          [
            estadisticas.totalVotos.toString(),
            candidatoGanador ? candidatoGanador.nombre : "Sin datos",
            candidatoGanador
              ? `${candidatoGanador.porcentaje.toFixed(2)}%`
              : "0%",
          ],
        ],
        theme: "grid",
        headStyles: { fillColor: [35, 87, 137], textColor: 255 },
      });

      // Capturar gráficas como imágenes
      if (graficaBarrasRef.current && graficaPieRef.current) {
        try {
          // Gráfica de barras
          const canvasBarras = await html2canvas(graficaBarrasRef.current, {
            scale: 2,
            logging: false,
            useCORS: true,
          });
          const imgDataBarras = canvasBarras.toDataURL("image/png");

          // Gráfica circular
          const canvasPie = await html2canvas(graficaPieRef.current, {
            scale: 2,
            logging: false,
            useCORS: true,
          });
          const imgDataPie = canvasPie.toDataURL("image/png");

          // Añadir una imagen en cada mitad de la página
          doc.text("Gráficas de Resultados", 15, 80);
          doc.addImage(imgDataBarras, "PNG", 15, 85, 180, 70);
          doc.addImage(imgDataPie, "PNG", 15, 160, 180, 70);
        } catch (error) {
          console.error("Error al capturar gráficas:", error);
        }
      }

      // Nueva página para los resultados detallados
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(35, 87, 137);
      doc.text("Resultados por Candidato", 15, 15);

      // Tabla de resultados por candidato
      autoTable(doc, {
        startY: 20,
        head: [["Candidato", "Votos", "Porcentaje"]],
        body: resultadosOrdenados.map((candidato) => [
          candidato.nombre,
          candidato.votos.toString(),
          `${candidato.porcentaje.toFixed(2)}%`,
        ]),
        theme: "grid",
        headStyles: { fillColor: [35, 87, 137], textColor: 255 },
      });

      // Nueva página para la lista de votantes
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(35, 87, 137);
      doc.text("Lista de Votantes", 15, 15);

      // Tabla de votantes
      autoTable(doc, {
        startY: 20,
        head: [["Nombre", "RFC", "Candidato", "Fecha de Voto"]],
        body: votantes.map((votante) => [
          votante.nombreCompleto,
          votante.rfc,
          votante.candidatoNombre,
          formatearFecha(votante.fechaVoto),
        ]),
        theme: "grid",
        headStyles: { fillColor: [35, 87, 137], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 1 },
        columnStyles: {
          3: { cellWidth: 50 },
        },
      });

      // Guardar el PDF
      doc.save(
        `reporte-votacion-amce-${format(new Date(), "yyyyMMdd-HHmm")}.pdf`
      );
      toast.success("Reporte PDF generado correctamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el reporte PDF");
    } finally {
      setGenerandoPDF(false);
    }
  };

  if (loadingEstadisticas && loadingVotantes) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">
          Estadísticas de Votación
        </h1>
        <div className="flex items-center gap-4 flex-wrap justify-end">
          <div className="text-right">
            <p className="font-medium">{usuario?.nombre}</p>
            <p className="text-sm text-muted-foreground">Administrador</p>
          </div>
          <Button variant="outline" onClick={handleCerrarSesion}>
            Cerrar sesión
          </Button>
        </div>
      </div>

      <div className="mb-6 gap-2 flex justify-between items-center">
        <Button
          onClick={generarPDF}
          disabled={generandoPDF || !estadisticas || !votantes}
          className="flex items-center"
        >
          {generandoPDF ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando PDF...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Descargar Reporte
            </>
          )}
        </Button>

        <Button
          onClick={handleActualizar}
          variant="outline"
          disabled={actualizando}
          className="flex items-center"
        >
          {actualizando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Actualizando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar datos
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="graficos">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="graficos" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estadísticas
          </TabsTrigger>
          <TabsTrigger value="votantes" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Votantes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graficos">
          {estadisticas ? (
            <div ref={graficosRef}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card className="col-span-1">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Votos
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {estadisticas.totalVotos}
                    </div>
                  </CardContent>
                </Card>

                {candidatoGanador && (
                  <Card className="col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        Candidato Liderando
                      </CardTitle>
                      <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        {candidatoGanador.imagenS3Llave && (
                          <div className="h-12 w-12 overflow-hidden rounded-full bg-muted">
                            <Image
                              src={candidatoGanador.imagenS3Llave}
                              alt={candidatoGanador.nombre}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <div className="text-xl font-semibold">
                            {candidatoGanador.nombre}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {candidatoGanador.votos} votos (
                            {candidatoGanador.porcentaje.toFixed(2)}%)
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Resultados por Candidato</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80" ref={graficaBarrasRef}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={datosBarra} layout="vertical">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                        />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="nombre"
                          type="category"
                          width={60}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(value, name, props) => [
                            `${value} votos (${props.payload.porcentaje.toFixed(
                              2
                            )}%)`,
                            props.payload.nombreCompleto,
                          ]}
                        />
                        <Bar dataKey="votos" fill="#0ea5e9">
                          <LabelList dataKey="votos" position="right" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribuciones de Votos</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80" ref={graficaPieRef}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={datosPie}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="nombre"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {datosPie.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => [
                            `${value} votos`,
                            props.payload.nombreCompleto,
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Detalle de Resultados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 text-left">Candidato</th>
                          <th className="py-2 text-right">Votos</th>
                          <th className="py-2 text-right">Porcentaje</th>
                          <th className="py-2 text-right">Gráfico</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultadosOrdenados.map((candidato, index) => (
                          <tr
                            key={candidato.candidatoId}
                            className="border-b last:border-0 hover:bg-muted/50"
                          >
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                {candidato.imagenS3Llave ? (
                                  <div className="h-8 w-8 overflow-hidden rounded-full">
                                    <Image
                                      src={candidato.imagenS3Llave}
                                      alt={candidato.nombre}
                                      width={32}
                                      height={32}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                    <User className="h-4 w-4" />
                                  </div>
                                )}
                                <span
                                  className={index === 0 ? "font-semibold" : ""}
                                >
                                  {candidato.nombre}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 text-right font-medium">
                              {candidato.votos}
                            </td>
                            <td className="py-3 text-right">
                              {candidato.porcentaje.toFixed(2)}%
                            </td>
                            <td className="py-3">
                              <div className="flex h-2 w-full min-w-[100px] overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full bg-primary"
                                  style={{ width: `${candidato.porcentaje}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p>No se pudieron cargar las estadísticas.</p>
          )}
        </TabsContent>

        <TabsContent value="votantes">
          {votantes ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Lista de Votantes
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({votantes.length} registros)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50 font-medium">
                          <th className="py-3 px-4 text-left">Nombre</th>
                          <th className="py-3 px-4 text-left">RFC</th>
                          <th className="py-3 px-4 text-left">
                            Candidato Votado
                          </th>
                          <th className="py-3 px-4 text-left">Fecha de voto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {votantesPaginados.map((votante) => (
                          <tr
                            key={votante.votoId}
                            className="border-b last:border-0 hover:bg-muted/50"
                          >
                            <td className="py-3 px-4">
                              <div>{votante.nombreCompleto}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div>{votante.rfc}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div>{votante.candidatoNombre}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="whitespace-nowrap">
                                {formatearFecha(votante.fechaVoto)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-6 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={irAPaginaAnterior}
                          className={
                            paginaActual <= 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>

                      {/* Mostrar primera página */}
                      {paginaActual > 3 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => irAPagina(1)}>
                            1
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {/* Mostrar elipsis si hay muchas páginas antes */}
                      {paginaActual > 4 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      {/* Mostrar página anterior si no es la primera */}
                      {paginaActual > 1 && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => irAPagina(paginaActual - 1)}
                          >
                            {paginaActual - 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {/* Página actual */}
                      <PaginationItem>
                        <PaginationLink
                          isActive
                          onClick={() => irAPagina(paginaActual)}
                        >
                          {paginaActual}
                        </PaginationLink>
                      </PaginationItem>

                      {/* Mostrar página siguiente si no es la última */}
                      {paginaActual < totalPaginas && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => irAPagina(paginaActual + 1)}
                          >
                            {paginaActual + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {/* Mostrar elipsis si hay muchas páginas después */}
                      {paginaActual < totalPaginas - 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      {/* Mostrar última página */}
                      {paginaActual < totalPaginas - 2 && totalPaginas > 1 && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => irAPagina(totalPaginas)}
                          >
                            {totalPaginas}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={irAPaginaSiguiente}
                          className={
                            paginaActual >= totalPaginas
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
                <div className="text-center text-sm text-muted-foreground mt-2">
                  Mostrando {indiceInicio + 1}-{indiceFin} de{" "}
                  {votantes?.length || 0} registros
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center p-12">
              {loadingVotantes ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p>Cargando lista de votantes...</p>
                </>
              ) : (
                <p>No se pudo cargar la lista de votantes.</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default withAuth(PaginaEstadisticas, { adminOnly: true });
