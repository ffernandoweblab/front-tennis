import { useState, useEffect, useMemo, useCallback } from "react";
import {
  RefreshCw,
  Download,
  Layers,
  AlertCircle,
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  Package,
  Tag,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import DashboardLayout from "../layouts/DashboardLayout";
import TarjetaStat from "../components/ui/TarjetaStat";
import BarraProgreso from "../components/ui/BarraProgreso";
import Button from "../components/ui/Button";
import { getLotes } from "../services/lotService";
import { getProductos } from "../services/productService";
import { getVentas } from "../services/saleService";
import { getCategorias } from "../services/categoryService";

function calcularInversion(desglose) {
  if (!desglose) return 0;
  const { mercancia = 0, viaticos = 0, gasolina = 0, otros = 0 } = desglose;
  return Number(mercancia) + Number(viaticos) + Number(gasolina) + Number(otros);
}

function CustomBarTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border p-3 rounded-sm shadow-xl text-xs space-y-1 z-50">
        <p className="font-semibold text-text mb-1 border-b border-border pb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`bar-tt-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted">{entry.name}:</span>
            </span>
            <span className="font-medium text-text">
              ${Number(entry.value || 0).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-surface border border-border p-2.5 rounded-sm shadow-xl text-xs space-y-0.5 z-50">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.payload.color }} />
          <span className="font-medium text-text">{data.name}</span>
        </div>
        <div className="text-accent font-semibold text-sm">
          ${Number(data.value || 0).toLocaleString()}
        </div>
        <div className="text-[11px] text-muted">
          {data.payload.porcentaje}% del total
        </div>
      </div>
    );
  }
  return null;
}

function Reportes() {
  const [lotes, setLotes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroLoteId, setFiltroLoteId] = useState("Todos");
  const [vistaLotes, setVistaLotes] = useState("grafica");

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const [dataLotes, dataProductos, dataVentas, dataCategorias] = await Promise.all([
        getLotes(),
        getProductos(),
        getVentas(),
        getCategorias(),
      ]);

      setLotes(Array.isArray(dataLotes) ? dataLotes : []);
      setProductos(Array.isArray(dataProductos) ? dataProductos : []);
      setVentas(Array.isArray(dataVentas) ? dataVentas : []);
      setCategorias(Array.isArray(dataCategorias) ? dataCategorias : []);
    } catch {
      setError("No se pudieron cargar los datos de los reportes.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const lotesFiltrados = useMemo(() => {
    if (filtroLoteId === "Todos") return lotes;
    return lotes.filter((l) => l._id === filtroLoteId);
  }, [lotes, filtroLoteId]);

  const productosFiltrados = useMemo(() => {
    if (filtroLoteId === "Todos") return productos;
    return productos.filter(
      (p) => p.lote === filtroLoteId || p.lote?._id === filtroLoteId
    );
  }, [productos, filtroLoteId]);

  const metricas = useMemo(() => {
    let mercanciaTotal = 0;
    let viaticosTotal = 0;
    let gasolinaTotal = 0;
    let otrosTotal = 0;

    for (const lote of lotesFiltrados) {
      const d = lote.desgloseInversion || {};
      mercanciaTotal += Number(d.mercancia || 0);
      viaticosTotal += Number(d.viaticos || 0);
      gasolinaTotal += Number(d.gasolina || 0);
      otrosTotal += Number(d.otros || 0);
    }

    const inversionTotal =
      mercanciaTotal + viaticosTotal + gasolinaTotal + otrosTotal;

    const ventasDirectas = ventas.reduce(
      (acc, v) => acc + Number(v.montoPagado || v.totalAPagar || 0),
      0
    );

    let ventasProductosVendidos = 0;
    let paresVendidos = 0;

    for (const prod of productosFiltrados) {
      const esVendido = !prod.activo || Number(prod.stock || 0) <= 0;
      if (esVendido) {
        paresVendidos++;
        ventasProductosVendidos += Number(prod.precioMercado || 0);
      }
    }

    const ventasTotal =
      ventasDirectas > 0 ? ventasDirectas : ventasProductosVendidos;

    const gananciaTotal = ventasTotal - inversionTotal;
    const roi = inversionTotal > 0
      ? ((gananciaTotal / inversionTotal) * 100).toFixed(1)
      : "0";

    return {
      inversionTotal,
      ventasTotal,
      gananciaTotal,
      roi,
      paresVendidos,
      gastos: {
        mercancia: mercanciaTotal,
        viaticos: viaticosTotal,
        gasolina: gasolinaTotal,
        otros: otrosTotal,
      },
    };
  }, [lotesFiltrados, productosFiltrados, ventas]);

  const rendimientoPorLote = useMemo(() => {
    return lotes.map((lote) => {
      const prods = productos.filter(
        (p) => p.lote === lote._id || p.lote?._id === lote._id
      );

      const inversion = calcularInversion(lote.desgloseInversion);
      let ingresosLote = 0;
      let vendidosLote = 0;

      for (const p of prods) {
        if (!p.activo || Number(p.stock || 0) <= 0) {
          vendidosLote++;
          ingresosLote += Number(p.precioMercado || 0);
        }
      }

      const gananciaLote = ingresosLote - inversion;
      const porcentajeRecuperado = inversion > 0
        ? Math.min(Math.round((ingresosLote / inversion) * 100), 100)
        : 0;

      return {
        _id: lote._id,
        nombre: `Lote ${lote.numLot ?? "--"}`,
        inversion,
        ventas: ingresosLote,
        ganancia: gananciaLote,
        vendidos: vendidosLote,
        totalProductos: prods.length,
        porcentajeRecuperado,
      };
    });
  }, [lotes, productos]);

  // Top Modelos para la tabla detallada
  const topModelos = useMemo(() => {
    const mapa = new Map();

    for (const prod of productos) {
      const nombre = prod.nombre || "Sin nombre";
      const actual = mapa.get(nombre) || {
        nombre,
        marca: prod.marca || "General",
        imagen: prod.imagenes?.[0] || null,
        vendidos: 0,
        ingreso: 0,
        costoTotal: 0,
        enStock: 0,
      };

      if (!actual.imagen && prod.imagenes?.[0]) {
        actual.imagen = prod.imagenes[0];
      }

      if (!prod.activo || Number(prod.stock || 0) <= 0) {
        actual.vendidos += 1;
        actual.ingreso += Number(prod.precioMercado || 0);
        actual.costoTotal += Number(prod.costo || 0);
      } else {
        actual.enStock += Number(prod.stock || 0);
      }

      mapa.set(nombre, actual);
    }

    const lista = Array.from(mapa.values());
    lista.sort((a, b) => b.ingreso - a.ingreso || b.vendidos - a.vendidos);
    return lista.slice(0, 5);
  }, [productos]);

  // Top Categorías por ingresos (incluyendo categorías sin productos)
  const topCategorias = useMemo(() => {
    const mapa = new Map();

    // 1. Inicializar con todas las categorías existentes de la base de datos
    for (const cat of categorias) {
      const nombre = typeof cat === "string" ? cat : (cat.nombre || "Sin nombre");
      const id = String(cat._id || nombre);
      mapa.set(id, {
        _id: id,
        nombre,
        vendidos: 0,
        ingreso: 0,
        totalProductos: 0,
        enStock: 0,
      });
    }

    // 2. Acumular información de los productos
    for (const prod of productosFiltrados) {
      const esVendido = !prod.activo || Number(prod.stock || 0) <= 0;
      const ingresoProd = Number(prod.precioMercado || 0);

      const cats = Array.isArray(prod.categorias) && prod.categorias.length > 0
        ? prod.categorias
        : [{ _id: "sin-cat", nombre: "Sin categoria" }];

      for (const cat of cats) {
        const catId = String(cat._id || (typeof cat === "string" ? cat : (cat.nombre || "Sin categoria")));
        const catNombre = typeof cat === "string" ? cat : (cat.nombre || "Sin categoria");

        let actual = mapa.get(catId);
        if (!actual) {
          actual = {
            _id: catId,
            nombre: catNombre,
            vendidos: 0,
            ingreso: 0,
            totalProductos: 0,
            enStock: 0,
          };
          mapa.set(catId, actual);
        }

        actual.totalProductos += 1;
        if (esVendido) {
          actual.vendidos += 1;
          actual.ingreso += ingresoProd;
        } else {
          actual.enStock += Number(prod.stock || 0);
        }
      }
    }

    const lista = Array.from(mapa.values());
    lista.sort(
      (a, b) =>
        b.ingreso - a.ingreso ||
        b.vendidos - a.vendidos ||
        b.totalProductos - a.totalProductos ||
        a.nombre.localeCompare(b.nombre)
    );
    return lista.slice(0, 5);
  }, [categorias, productosFiltrados]);

  const maxIngresoCategoria = useMemo(() => {
    if (topCategorias.length === 0) return 1;
    const max = Math.max(...topCategorias.map((c) => c.ingreso));
    return max > 0 ? max : 1;
  }, [topCategorias]);

  const datosGastosPie = useMemo(() => {
    const total = metricas.inversionTotal || 1;
    const items = [
      {
        name: "Mercancia",
        value: metricas.gastos.mercancia,
        color: "#C9A876",
        porcentaje: ((metricas.gastos.mercancia / total) * 100).toFixed(1),
      },
      {
        name: "Viaticos",
        value: metricas.gastos.viaticos,
        color: "#6FA87C",
        porcentaje: ((metricas.gastos.viaticos / total) * 100).toFixed(1),
      },
      {
        name: "Gasolina",
        value: metricas.gastos.gasolina,
        color: "#E5A962",
        porcentaje: ((metricas.gastos.gasolina / total) * 100).toFixed(1),
      },
      {
        name: "Otros",
        value: metricas.gastos.otros,
        color: "#8B95A1",
        porcentaje: ((metricas.gastos.otros / total) * 100).toFixed(1),
      },
    ];
    return items.filter((g) => g.value > 0);
  }, [metricas]);

  const exportarReporte = useCallback(() => {
    const filas = [
      ["REPORTE FINANCIERO DE VENTAS Y LOTES"],
      ["Fecha", new Date().toLocaleDateString()],
      ["Filtro Lote", filtroLoteId],
      [""],
      ["RESUMEN GENERAL"],
      ["Inversion Total", `$${metricas.inversionTotal}`],
      ["Ventas Totales", `$${metricas.ventasTotal}`],
      ["Ganancia Neta", `$${metricas.gananciaTotal}`],
      ["ROI (%)", `${metricas.roi}%`],
      ["Pares Vendidos", metricas.paresVendidos],
      [""],
      ["DESGLOSE DE GASTOS"],
      ["Mercancia", `$${metricas.gastos.mercancia}`],
      ["Viaticos", `$${metricas.gastos.viaticos}`],
      ["Gasolina", `$${metricas.gastos.gasolina}`],
      ["Otros", `$${metricas.gastos.otros}`],
      [""],
      ["RENDIMIENTO POR LOTE"],
      ["Lote", "Inversion", "Ingresos", "Ganancia", "Pares Vendidos", "Recuperacion %"],
      ...rendimientoPorLote.map((l) => [
        l.nombre,
        l.inversion,
        l.ventas,
        l.ganancia,
        l.vendidos,
        `${l.porcentajeRecuperado}%`,
      ]),
      [""],
      ["TOP CATEGORIAS"],
      ["Categoria", "Pares Vendidos", "Ingresos"],
      ...topCategorias.map((c) => [c.nombre, c.vendidos, c.ingreso]),
      [""],
      ["TOP MODELOS"],
      ["Modelo", "Marca", "Vendidos", "Ingresos"],
      ...topModelos.map((m) => [m.nombre, m.marca, m.vendidos, m.ingreso]),
    ];

    const csvContent = filas
      .map((fila) => fila.map((campo) => `"${String(campo).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte_ventas_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [metricas, rendimientoPorLote, topCategorias, topModelos, filtroLoteId]);

  return (
    <DashboardLayout>
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-text">Reportes</h1>
          <p className="text-muted mt-1">Rendimiento financiero general y balance visual por lote.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Filtrar:</span>
            <select
              value={filtroLoteId}
              onChange={(e) => setFiltroLoteId(e.target.value)}
              className="bg-surface border border-border rounded-sm px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
            >
              <option value="Todos">Todos los lotes</option>
              {lotes.map((l) => (
                <option key={l._id} value={l._id}>
                  Lote {l.numLot ?? "--"}
                </option>
              ))}
            </select>
          </div>

          <Button
            icono={RefreshCw}
            onClick={cargarDatos}
            disabled={cargando}
            title="Actualizar datos"
          >
            Actualizar
          </Button>
          <Button
            variante="primary"
            icono={Download}
            onClick={exportarReporte}
            title="Descargar reporte en CSV"
          >
            Exportar CSV
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

      {/* Tarjetas de Estadísticas Principales */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <TarjetaStat
          titulo="Inversion total"
          valor={`$${metricas.inversionTotal.toLocaleString()}`}
        />
        <TarjetaStat
          titulo="Ventas registradas"
          valor={`$${metricas.ventasTotal.toLocaleString()}`}
        />
        <TarjetaStat
          titulo="Ganancia neta"
          valor={`$${metricas.gananciaTotal.toLocaleString()}`}
          className={metricas.gananciaTotal >= 0 ? "text-positive" : "text-negative"}
        />
        <TarjetaStat
          titulo="Retorno de inversion"
          valor={`${metricas.roi}%`}
          className={Number(metricas.roi) >= 0 ? "text-positive" : "text-negative"}
        />
      </section>

      {/* Fila Principal de Gráficas: Inversión vs Ventas por Lote + Desglose de Gastos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Gráfica de Lotes */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={20} className="text-accent" />
              <h2 className="font-display text-xl text-text">Inversion vs Ventas por Lote</h2>
            </div>
            <div className="flex items-center gap-1 bg-surface border border-border p-1 rounded-sm text-xs">
              <button
                type="button"
                onClick={() => setVistaLotes("grafica")}
                className={`px-2.5 py-1 rounded-sm transition-colors ${
                  vistaLotes === "grafica"
                    ? "bg-accent text-bg font-medium"
                    : "text-muted hover:text-text"
                }`}
              >
                Grafica
              </button>
              <button
                type="button"
                onClick={() => setVistaLotes("lista")}
                className={`px-2.5 py-1 rounded-sm transition-colors ${
                  vistaLotes === "lista"
                    ? "bg-accent text-bg font-medium"
                    : "text-muted hover:text-text"
                }`}
              >
                Barras de lista
              </button>
            </div>
          </div>

          <div className="border border-border rounded-sm bg-surface p-5 min-h-[340px] flex flex-col justify-center">
            {cargando && (
              <p className="text-center text-sm text-muted py-12">
                Cargando datos de rendimiento...
              </p>
            )}

            {!cargando && rendimientoPorLote.length === 0 && (
              <div className="text-center py-12">
                <Layers className="mx-auto mb-2 text-muted" size={32} />
                <p className="text-sm text-muted">Aun no hay lotes registrados para graficar.</p>
              </div>
            )}

            {!cargando && rendimientoPorLote.length > 0 && vistaLotes === "grafica" && (
              <div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={rendimientoPorLote}
                      margin={{ top: 15, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A3138" vertical={false} />
                      <XAxis
                        dataKey="nombre"
                        stroke="#8B95A1"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: "#2A3138" }}
                      />
                      <YAxis
                        stroke="#8B95A1"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: "#2A3138" }}
                        tickFormatter={(v) => `$${v >= 1000 ? `${v / 1000}k` : v}`}
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Legend
                        wrapperStyle={{ paddingTop: 12 }}
                        formatter={(val) => <span className="text-xs text-muted">{val}</span>}
                      />
                      <Bar
                        dataKey="inversion"
                        name="Inversion"
                        fill="#8B95A1"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={45}
                      />
                      <Bar
                        dataKey="ventas"
                        name="Ventas"
                        fill="#C9A876"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={45}
                      />
                      <Bar
                        dataKey="ganancia"
                        name="Ganancia Neta"
                        fill="#6FA87C"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={45}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {!cargando && rendimientoPorLote.length > 0 && vistaLotes === "lista" && (
              <div className="space-y-5">
                {rendimientoPorLote.map((lote) => (
                  <div key={lote._id} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text">{lote.nombre}</span>
                        <span className="text-xs text-muted">
                          ({lote.vendidos} pares vendidos)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-text font-medium">
                          ${lote.ventas.toLocaleString()}
                        </span>
                        <span className="text-muted text-xs">
                          {" "}/ ${lote.inversion.toLocaleString()} inv.
                        </span>
                      </div>
                    </div>

                    <BarraProgreso porcentaje={lote.porcentajeRecuperado} />

                    <div className="flex justify-between text-[11px] text-muted pt-1">
                      <span>
                        Ganancia neta:{" "}
                        <strong
                          className={lote.ganancia >= 0 ? "text-positive" : "text-negative"}
                        >
                          ${lote.ganancia.toLocaleString()}
                        </strong>
                      </span>
                      <span>{lote.totalProductos} modelos en lote</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Gráfica de Dona: Desglose de Gastos */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChartIcon size={20} className="text-accent" />
              <h2 className="font-display text-xl text-text">Desglose de Gastos</h2>
            </div>
            <span className="text-xs text-muted">Distribucion de capital</span>
          </div>

          <div className="border border-border rounded-sm bg-surface p-5 min-h-[340px] flex flex-col justify-between">
            {cargando ? (
              <p className="text-center text-sm text-muted py-12">Calculando gastos...</p>
            ) : datosGastosPie.length === 0 ? (
              <div className="text-center py-12 text-muted text-sm">
                No hay inversion registrada para desglosar.
              </div>
            ) : (
              <>
                <div className="h-[200px] w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosGastosPie}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {datosGastosPie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#1C2127" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centro de la dona */}
                  <div className="absolute text-center pointer-events-none">
                    <span className="block text-[10px] text-muted uppercase tracking-wider">Inversion</span>
                    <span className="block font-bold text-text text-sm">
                      ${metricas.inversionTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Leyenda y detalles */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
                  {datosGastosPie.map((gasto) => (
                    <div key={gasto.name} className="flex items-center justify-between text-xs p-1.5 rounded-sm bg-bg/50">
                      <span className="flex items-center gap-1.5 text-muted truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: gasto.color }} />
                        <span className="truncate">{gasto.name}</span>
                      </span>
                      <span className="font-medium text-text ml-1 shrink-0">
                        {gasto.porcentaje}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Sección Inferior: Ingresos por Categoría y Detalle de Modelos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ranking visual de Top Categorías */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-positive" />
              <h2 className="font-display text-xl text-text">Ingresos por Categoria</h2>
            </div>
            <span className="text-xs text-muted">Top 5</span>
          </div>

          <div className="border border-border rounded-sm bg-surface p-5 space-y-4 min-h-[300px] flex flex-col justify-center">
            {cargando ? (
              <p className="text-center text-sm text-muted py-8">Cargando categorias...</p>
            ) : topCategorias.length === 0 ? (
              <p className="text-center text-sm text-muted py-8">No hay ventas registradas aun.</p>
            ) : (
              topCategorias.map((item, index) => {
                const porcentaje = Math.round((item.ingreso / maxIngresoCategoria) * 100);
               return (
  <div key={item.nombre} className="space-y-1.5">
    <div className="flex items-center justify-between gap-2 sm:gap-3">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <span className="text-xs font-bold text-muted w-4 shrink-0">
          #{index + 1}
        </span>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-sm border border-border flex items-center justify-center text-accent shrink-0 bg-background/50">
          <Tag size={14} className="sm:hidden" />
          <Tag size={16} className="hidden sm:block" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text truncate" title={item.nombre}>
            {item.nombre}
          </p>
          <p className="text-[11px] sm:text-xs text-muted truncate">
            {item.vendidos} {item.vendidos === 1 ? "par vendido" : "pares vendidos"} • {item.totalProductos} {item.totalProductos === 1 ? "modelo" : "modelos"}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className="text-xs sm:text-sm font-semibold text-accent whitespace-nowrap">
          ${item.ingreso.toLocaleString()}
        </span>
      </div>
    </div>
    {/* Barra visual de recaudación */}
    <div className="w-full bg-background/60 h-1.5 rounded-full overflow-hidden ml-6 sm:ml-7">
      <div
        className="bg-accent h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(porcentaje, 4)}%` }}
      />
    </div>
  </div>
);
              })
            )}
          </div>
        </section>

        {/* Tabla Detallada de Modelos con Foto */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-text">Detalle de Modelos Mas Vendidos</h2>
            <span className="text-xs text-muted">Desglose de inventario y recaudacion</span>
          </div>

          <div className="border border-border rounded-sm overflow-hidden bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface text-muted text-left border-b border-border">
                  <th className="pl-5 pr-2 py-3 font-normal w-14">Foto</th>
                  <th className="px-4 py-3 font-normal">Modelo</th>
                  <th className="px-4 py-3 font-normal">Marca</th>
                  <th className="px-4 py-3 font-normal text-right">Vendidos</th>
                  <th className="px-4 py-3 font-normal text-right">En Stock</th>
                  <th className="pr-5 pl-4 py-3 font-normal text-right">Ingreso generado</th>
                </tr>
              </thead>
              <tbody>
                {cargando && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-muted">
                      Cargando modelos...
                    </td>
                  </tr>
                )}

                {!cargando && topModelos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-muted">
                      Aun no hay registros de modelos vendidos.
                    </td>
                  </tr>
                )}

                {!cargando &&
                  topModelos.map((item) => (
                    <tr
                      key={item.nombre}
                      className="border-b border-border last:border-0 hover:bg-background/40 transition-colors"
                    >
                      <td className="pl-5 pr-2 py-2.5">
                        {item.imagen ? (
                          <img
                            src={item.imagen}
                            alt={item.nombre}
                            className="w-10 h-10 rounded-sm object-cover border border-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-sm border border-border flex items-center justify-center text-muted bg-background/50">
                            <Package size={16} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-text font-medium">{item.nombre}</td>
                      <td className="px-4 py-2.5 text-muted">{item.marca}</td>
                      <td className="px-4 py-2.5 text-right text-muted">{item.vendidos}</td>
                      <td className="px-4 py-2.5 text-right text-muted">{item.enStock}</td>
                      <td className="pr-5 pl-4 py-2.5 text-right text-text font-medium">
                        ${item.ingreso.toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default Reportes;