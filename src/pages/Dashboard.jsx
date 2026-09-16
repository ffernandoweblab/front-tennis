import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Layers, Package, ArrowUpRight, AlertCircle } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import TarjetaStat from "../components/ui/TarjetaStat";
import BarraProgreso from "../components/ui/BarraProgreso";
import Button from "../components/ui/Button";
import { getLotes } from "../services/lotService";
import { getProductos } from "../services/productService";

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
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const [dataLotes, dataProductos] = await Promise.all([
        getLotes(),
        getProductos(),
      ]);

      setLotes(Array.isArray(dataLotes) ? dataLotes : []);

      const normalizados = (Array.isArray(dataProductos) ? dataProductos : []).map((item) => ({
        ...item,
        estado: derivarEstado(item),
      }));
      setProductos(normalizados);
    } catch {
      setError("No se pudieron cargar los datos del dashboard. Verifica tu conexion.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const stats = useMemo(() => {
    const totalInversionLotes = lotes.reduce(
      (acc, lote) => acc + calcularInversion(lote.desgloseInversion),
      0
    );

    let valorInventario = 0;
    let gananciaPotencial = 0;
    let totalStock = 0;
    let disponiblesCount = 0;

    for (const item of productos) {
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

    return {
      inversion: totalInversionLotes,
      valorInventario,
      gananciaPotencial,
      disponiblesCount,
      totalStock,
    };
  }, [lotes, productos]);

  const rendimientoLotes = useMemo(() => {
    return lotes.map((lote) => {
      const productosDelLote = productos.filter(
        (p) => p.lote === lote._id || p.lote?._id === lote._id
      );

      const paresTotales = productosDelLote.reduce(
        (acc, p) => acc + Math.max(Number(p.stock || 0), 1),
        0
      );
      const paresVendidos = productosDelLote.filter((p) => p.estado === "Vendido").length;
      const inversion = calcularInversion(lote.desgloseInversion);

      const avance = paresTotales > 0
        ? Math.min(Math.round((paresVendidos / paresTotales) * 100), 100)
        : 0;

      return {
        ...lote,
        productosCount: productosDelLote.length,
        paresTotales,
        paresVendidos,
        inversion,
        avance,
      };
    });
  }, [lotes, productos]);

  const ultimosProductos = useMemo(() => {
    return [...productos].slice(-5).reverse();
  }, [productos]);

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

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <TarjetaStat
          titulo="Inversion en lotes"
          valor={`$${stats.inversion.toLocaleString()}`}
        />
        <TarjetaStat
          titulo="Valor en inventario"
          valor={`$${stats.valorInventario.toLocaleString()}`}
        />
        <TarjetaStat
          titulo="Ganancia potencial"
          valor={`$${stats.gananciaPotencial.toLocaleString()}`}
          className={stats.gananciaPotencial < 0 ? "text-negative" : "text-positive"}
        />
        <TarjetaStat
          titulo="Pares disponibles"
          valor={`${stats.disponiblesCount} pares`}
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
              rendimientoLotes.map((lote) => (
                <div
                  key={lote._id}
                  onClick={() => navigate(`/lotes/${lote._id}`)}
                  className="p-5 hover:bg-background/40 cursor-pointer transition-colors space-y-3"
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
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        {lote.productosCount} modelos registrados
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted">Inversion</p>
                      <p className="text-sm font-medium text-text">
                        ${lote.inversion.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <BarraProgreso porcentaje={lote.avance} />
                </div>
              ))}
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
              ultimosProductos.map((prod) => (
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
                      <p className="text-sm text-text truncate font-medium">
                        {prod.nombre}
                      </p>
                      <p className="text-xs text-muted truncate">
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
              ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;