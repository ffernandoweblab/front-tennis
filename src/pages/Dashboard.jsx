import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Layers, Package, ArrowUpRight, AlertCircle } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import TarjetaStat from "../components/ui/TarjetaStat";
import BarraProgreso from "../components/ui/BarraProgreso";
import Button from "../components/ui/Button";
import api from "../services/api";
import { getLotes } from "../services/lotService";
import { getProductos } from "../services/productService";

export const getLotSales = async (id) => {
  const response = await api.get(`/lot/${id}/sales`);
  return response.data;
};

function calcularInversion(desglose) {
  if (!desglose) return 0;
  const { mercancia = 0, viaticos = 0, gasolina = 0, otros = 0 } = desglose;
  return Number(mercancia) + Number(viaticos) + Number(gasolina) + Number(otros);
}

function derivarEstado(item) {
  if (item.activo === false || item.activo === "false") return "Agotado";
  if (Number(item.stock) <= 0) return "Agotado";
  return "Disponible";
}

function Dashboard() {
  const navigate = useNavigate();

  const [lotes, setLotes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [ventasLotes, setVentasLotes] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroLoteId, setFiltroLoteId] = useState("");

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const [dataLotes, dataProductos] = await Promise.all([
        getLotes(),
        getProductos(),
      ]);

      const listaLotes = Array.isArray(dataLotes) ? dataLotes : [];
      setLotes(listaLotes);

      const normalizados = (Array.isArray(dataProductos) ? dataProductos : []).map((item) => ({
        ...item,
        estado: derivarEstado(item),
      }));
      setProductos(normalizados);

      if (listaLotes.length > 0) {
        setFiltroLoteId((prev) => {
          if (!prev || prev === "Todos") {
            return listaLotes[0]._id;
          }
          const existe = listaLotes.some((l) => l._id === prev);
          return existe ? prev : listaLotes[0]._id;
        });

        const resultadosVentas = await Promise.allSettled(
          listaLotes.map((l) => getLotSales(l._id))
        );

        const mapaVentas = {};
        listaLotes.forEach((l, index) => {
          const res = resultadosVentas[index];
          if (res && res.status === "fulfilled" && res.value) {
            mapaVentas[l._id] = res.value;
          }
        });
        setVentasLotes(mapaVentas);
      } else {
        setFiltroLoteId("Todos");
        setVentasLotes({});
      }
    } catch {
      setError("No se pudieron cargar los datos del dashboard. Verifica tu conexion.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const loteActual = useMemo(() => {
    if (filtroLoteId === "Todos" || !filtroLoteId) return null;
    return lotes.find((l) => l._id === filtroLoteId) || null;
  }, [lotes, filtroLoteId]);

  const indiceLoteActual = useMemo(() => {
    if (filtroLoteId === "Todos" || !filtroLoteId) return -1;
    return lotes.findIndex((l) => l._id === filtroLoteId);
  }, [lotes, filtroLoteId]);

  const irLoteAnterior = useCallback(() => {
    if (indiceLoteActual > 0) {
      setFiltroLoteId(lotes[indiceLoteActual - 1]._id);
    }
  }, [indiceLoteActual, lotes]);

  const irLoteSiguiente = useCallback(() => {
    if (indiceLoteActual >= 0 && indiceLoteActual < lotes.length - 1) {
      setFiltroLoteId(lotes[indiceLoteActual + 1]._id);
    } else if (indiceLoteActual === -1 && lotes.length > 0) {
      setFiltroLoteId(lotes[0]._id);
    }
  }, [indiceLoteActual, lotes]);

  const lotesFiltrados = useMemo(() => {
    if (filtroLoteId === "Todos" || !filtroLoteId) return lotes;
    return lotes.filter((l) => l._id === filtroLoteId);
  }, [lotes, filtroLoteId]);

  const productosFiltrados = useMemo(() => {
    if (filtroLoteId === "Todos" || !filtroLoteId) return productos;
    return productos.filter(
      (p) => p.lote === filtroLoteId || p.lote?._id === filtroLoteId
    );
  }, [productos, filtroLoteId]);

  const mapaNombresLotes = useMemo(() => {
    const mapa = {};
    lotes.forEach((l) => {
      mapa[l._id] = l.numLot || "Lote";
    });
    return mapa;
  }, [lotes]);

  const stats = useMemo(() => {
    const totalInversionLotes = lotesFiltrados.reduce(
      (acc, lote) => acc + calcularInversion(lote.desgloseInversion),
      0
    );

    let valorInventario = 0;
    let gananciaPotencial = 0;
    let totalStock = 0;
    let disponiblesCount = 0;

    for (const item of productosFiltrados) {
      const estaInactivo = item.activo === false || item.activo === "false";
      const stock = estaInactivo ? 0 : Number(item.stock || 0);
      const costo = Number(item.costo || 0);
      const venta = Number(item.precioMercado || 0);

      if (item.estado === "Disponible" && stock > 0) {
        disponiblesCount += stock;
        valorInventario += costo * stock;
        gananciaPotencial += (venta - costo) * stock;
      }
      totalStock += stock;
    }

    let ventasRealizadas = 0;
    let paresVendidos = 0;
    for (const lote of lotesFiltrados) {
      const res = ventasLotes[lote._id]?.resumen;
      if (res) {
        ventasRealizadas += Number(res.totalVendido || 0);
        paresVendidos += Number(res.unidadesVendidas || 0);
      }
    }

    return {
      inversion: totalInversionLotes,
      valorInventario,
      gananciaPotencial,
      disponiblesCount,
      totalStock,
      ventasRealizadas,
      paresVendidos,
    };
  }, [lotesFiltrados, productosFiltrados, ventasLotes]);

  const rendimientoLotes = useMemo(() => {
    return lotes.map((lote) => {
      const productosDelLote = productos.filter(
        (p) => p.lote === lote._id || p.lote?._id === lote._id
      );

      const salesData = ventasLotes[lote._id];
      const inversion = calcularInversion(lote.desgloseInversion);

      let avance = 0;
      let paresTotales = 0;
      let paresVendidos = 0;
      let totalVendido = 0;
      let totalRecaudado = 0;

      if (salesData && salesData.resumen) {
        avance = Number(salesData.resumen.porcentajeVendido ?? 0);
        paresVendidos = Number(salesData.resumen.unidadesVendidas ?? 0);
        paresTotales = Number(salesData.resumen.unidadesTotales ?? 0);
        totalVendido = Number(salesData.resumen.totalVendido ?? 0);
        totalRecaudado = Number(salesData.resumen.totalRecaudado ?? 0);
      } else {
        paresTotales = productosDelLote.reduce(
          (acc, p) => acc + Math.max(Number(p.stock || 0), 1),
          0
        );
        paresVendidos = productosDelLote.filter((p) => p.estado === "Vendido").length;
        avance = paresTotales > 0
          ? Math.min(Math.round((paresVendidos / paresTotales) * 100), 100)
          : 0;
      }

      const avanceFormateado = Number.isInteger(avance)
        ? avance
        : Number(avance.toFixed(1));

      return {
        ...lote,
        productosCount: productosDelLote.length,
        paresTotales,
        paresVendidos,
        inversion,
        avance: Math.min(Math.max(avanceFormateado, 0), 100),
        totalVendido,
        totalRecaudado,
      };
    });
  }, [lotes, productos, ventasLotes]);

  const ultimosProductos = useMemo(() => {
    return [...productosFiltrados].slice(-6).reverse();
  }, [productosFiltrados]);

  return (
    <DashboardLayout>
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-text">Resumen del negocio</h1>
          <p className="text-muted mt-1">Estado actual de tus lotes, inventario y ganancias.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            icono={RefreshCw}
            onClick={cargarDatos}
            disabled={cargando}
            title="Actualizar datos"
          >
            Actualizar
          </Button>
          <Button
            icono={Plus}
            onClick={() => navigate("/lotes")}
          >
            Nuevo lote
          </Button>
          <Button
            variante="primary"
            icono={Plus}
            onClick={() => navigate("/inventario/newProduct")}
          >
            Registrar producto
          </Button>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 rounded-sm border border-negative/40 bg-negative/10 flex items-center justify-between text-sm text-negative">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <Button variante="ghost" onClick={cargarDatos} className="text-xs py-1 px-3">
            Reintentar
          </Button>
        </div>
      )}

      {/* Selector y Navegacion de Lotes en Dashboard */}
      <div className="mb-8 border border-border rounded-sm bg-surface p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
              <Layers size={16} />
            </div>
            <div>
              <p className="text-xs text-muted">Lote en consulta</p>
              <div className="flex items-center gap-2">
                <span className="font-display text-base text-text font-medium">
                  {loteActual ? (loteActual.numLot ?? "Lote seleccionado") : "Todos los lotes (Consolidado)"}
                </span>
                {loteActual && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-sm border font-medium ${
                      loteActual.estado === "activo"
                        ? "text-positive border-positive/40 bg-positive/5"
                        : "text-muted border-border bg-bg"
                    }`}
                  >
                    {loteActual.estado || "activo"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navegacion rapida Anterior / Siguiente */}
          {lotes.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={irLoteAnterior}
                disabled={indiceLoteActual <= 0}
                className="px-3 py-1.5 text-xs border border-border rounded-sm text-text bg-bg hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium"
                title="Lote anterior"
              >
                &larr; Anterior
              </button>
              <span className="text-xs text-muted tabular-nums px-1">
                {indiceLoteActual >= 0 ? `${indiceLoteActual + 1} de ${lotes.length}` : `Todos (${lotes.length})`}
              </span>
              <button
                type="button"
                onClick={irLoteSiguiente}
                disabled={indiceLoteActual >= lotes.length - 1}
                className="px-3 py-1.5 text-xs border border-border rounded-sm text-text bg-bg hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium"
                title="Siguiente lote"
              >
                Siguiente &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Pestanas para cambiar entre lotes */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {lotes.map((lote, idx) => {
            const seleccionado = filtroLoteId === lote._id;
            return (
              <button
                key={lote._id}
                type="button"
                onClick={() => setFiltroLoteId(lote._id)}
                className={`px-3.5 py-1.5 rounded-sm text-xs font-medium transition-all shrink-0 border flex items-center gap-2 ${
                  seleccionado
                    ? "bg-accent text-bg border-accent shadow-sm"
                    : "bg-bg text-muted border-border hover:text-text hover:border-text/40"
                }`}
              >
                <span>{lote.numLot || `Lote ${idx + 1}`}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-xs border ${
                    seleccionado
                      ? "border-bg/30 text-bg"
                      : lote.estado === "activo"
                      ? "border-positive/40 text-positive"
                      : "border-border text-muted"
                  }`}
                >
                  {lote.estado || "activo"}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setFiltroLoteId("Todos")}
            className={`px-3.5 py-1.5 rounded-sm text-xs font-medium transition-all shrink-0 border ${
              filtroLoteId === "Todos"
                ? "bg-accent text-bg border-accent shadow-sm"
                : "bg-bg text-muted border-border hover:text-text hover:border-text/40"
            }`}
          >
            Todos los lotes (Consolidado)
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <TarjetaStat
          titulo={loteActual ? `Inversion (${loteActual.numLot ?? "Lote"})` : "Inversion total en lotes"}
          valor={`$${stats.inversion.toLocaleString()}`}
          subtitulo={
            loteActual
              ? `Estado: ${loteActual.estado || "activo"}`
              : `${lotes.length} ${lotes.length === 1 ? "lote registrado" : "lotes registrados"}`
          }
        />
        <TarjetaStat
          titulo={loteActual ? `Valor inventario (${loteActual.numLot ?? "Lote"})` : "Valor en inventario"}
          valor={`$${stats.valorInventario.toLocaleString()}`}
          subtitulo={`${stats.disponiblesCount} pares disponibles`}
        />
        <TarjetaStat
          titulo={loteActual ? `Ganancia potencial (${loteActual.numLot ?? "Lote"})` : "Ganancia potencial"}
          valor={`$${stats.gananciaPotencial.toLocaleString()}`}
          className={stats.gananciaPotencial < 0 ? "text-negative" : "text-positive"}
          subtitulo={stats.gananciaPotencial >= 0 ? "Estimada por vender" : "Bajo costo"}
        />
        <TarjetaStat
          titulo={loteActual ? `Pares disponibles (${loteActual.numLot ?? "Lote"})` : "Pares disponibles"}
          valor={`${stats.disponiblesCount} pares`}
          subtitulo={
            stats.paresVendidos > 0
              ? `${stats.paresVendidos} vendidos ($${stats.ventasRealizadas.toLocaleString()})`
              : "Sin ventas aun"
          }
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-text">Rendimiento de lotes</h2>
              <p className="text-xs text-muted mt-0.5">Avance de ventas y estatus por lote</p>
            </div>
            <button
              onClick={() => navigate("/lotes")}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              Ver todos los lotes
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="border border-border rounded-sm bg-surface divide-y divide-border">
            {cargando && (
              <div className="p-8 text-center text-muted text-sm">
                Cargando rendimiento de lotes...
              </div>
            )}

            {!cargando && rendimientoLotes.length === 0 && (
              <div className="p-8 text-center">
                <Layers className="mx-auto mb-2 text-muted" size={28} />
                <p className="text-sm text-muted">Aun no tienes lotes registrados.</p>
                <button
                  onClick={() => navigate("/lotes")}
                  className="text-xs text-accent hover:underline mt-2 inline-block"
                >
                  Registrar tu primer lote
                </button>
              </div>
            )}

            {!cargando &&
              rendimientoLotes.map((lote) => {
                const esLoteSeleccionado = filtroLoteId === lote._id;
                return (
                  <div
                    key={lote._id}
                    onClick={() => setFiltroLoteId(lote._id)}
                    className={`p-5 cursor-pointer transition-all space-y-3 ${
                      esLoteSeleccionado
                        ? "bg-accent/5 border-l-4 border-l-accent"
                        : "hover:bg-background/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text">
                            {lote.numLot ?? "--"}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-sm border ${
                              lote.estado === "activo"
                                ? "text-positive border-positive"
                                : "text-muted border-border"
                            }`}
                          >
                            {lote.estado || "activo"}
                          </span>
                          {esLoteSeleccionado && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-accent/20 text-accent font-medium">
                              Consultando
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          {lote.productosCount} modelos registrados
                          {lote.paresTotales > 0 ? ` • ${lote.paresVendidos} de ${lote.paresTotales} pares vendidos` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-muted">Inversion</p>
                          <p className="text-sm font-medium text-text">
                            ${lote.inversion.toLocaleString()}
                          </p>
                          {lote.totalVendido > 0 && (
                            <p className="text-[11px] text-positive mt-0.5">
                              Vendido: ${lote.totalVendido.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/lotes/${lote._id}`);
                          }}
                          className="p-1.5 text-muted hover:text-accent rounded-sm hover:bg-surface border border-transparent hover:border-border transition-colors"
                          title="Ir a detalle del lote"
                        >
                          <ArrowUpRight size={15} />
                        </button>
                      </div>
                    </div>

                    <BarraProgreso
                      porcentaje={lote.avance}
                      texto={`${lote.avance}% vendido`}
                    />
                  </div>
                );
              })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-text">Inventario reciente</h2>
              <p className="text-xs text-muted mt-0.5">Ultimos modelos ingresados</p>
            </div>
            <button
              onClick={() => navigate("/inventario")}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              Ir a inventario
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="border border-border rounded-sm bg-surface divide-y divide-border">
            {cargando && (
              <div className="p-8 text-center text-muted text-sm">
                Cargando inventario...
              </div>
            )}

            {!cargando && ultimosProductos.length === 0 && (
              <div className="p-8 text-center">
                <Package className="mx-auto mb-2 text-muted" size={28} />
                <p className="text-sm text-muted">No hay productos en inventario.</p>
                <button
                  onClick={() => navigate("/inventario/newProduct")}
                  className="text-xs text-accent hover:underline mt-2 inline-block"
                >
                  Agregar producto
                </button>
              </div>
            )}

            {!cargando &&
              ultimosProductos.map((prod) => {
                const loteIdProd = prod.lote?._id || prod.lote;
                const nombreLoteProd = prod.lote?.numLot || mapaNombresLotes[loteIdProd] || "Lote";
                return (
                  <div
                    key={prod._id}
                    onClick={() => navigate(`/inventario/editar/${prod._id}`)}
                    className="p-3.5 hover:bg-background/40 cursor-pointer transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {prod.imagenes?.[0] ? (
                        <img
                          src={prod.imagenes[0]}
                          alt={prod.nombre}
                          className="w-10 h-10 rounded-sm object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-sm border border-border flex items-center justify-center text-muted shrink-0">
                          <Package size={16} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-text truncate font-medium">
                            {prod.nombre}
                          </p>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-xs border border-border text-muted bg-bg/80 shrink-0">
                            {nombreLoteProd}
                          </span>
                        </div>
                        <p className="text-xs text-muted truncate mt-0.5">
                          {prod.marca || "Sin marca"} {prod.talla ? ` - Talla ${prod.talla}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-text">
                        ${Number(prod.precioMercado || 0).toLocaleString()}
                      </p>
                      <span className="text-[11px] text-muted">
                        Stock: {prod.activo === false || prod.activo === "false" ? 0 : (prod.stock ?? 0)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;