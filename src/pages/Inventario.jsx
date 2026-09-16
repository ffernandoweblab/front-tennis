import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SlidersHorizontal, ImageOff, TriangleAlert, RefreshCw, Download, Plus, Trash2, Loader2 } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import { getProductos, eliminarProducto } from "../services/productService";
import TarjetaStat from "../components/ui/TarjetaStat";
import Campo from "../components/form/Campo";
import SelectNativo from "../components/form/SelectNativo";
import FilaEsqueleto from "../components/ui/FilaEsqueleto";
import Button from "../components/ui/Button";

const estadoColor = {
  Disponible: "text-positive border-positive",
  Agotado: "text-negative border-negative",
  Vendido: "text-muted border-border",
  Apartado: "text-accent border-accent",
};

function derivarEstado(item) {
  if (item.activo === false || item.activo === "false") return "Agotado";
  if (Number(item.stock) <= 0) return "Agotado";
  return "Disponible";
}



function FilaProducto({ item, onEditar, onEliminar }) {
  const perdida = Number(item.precioMercado) < Number(item.costo);
  const estaAgotado = item.activo === false || item.activo === "false" || Number(item.stock) <= 0;
  const stockVisible = estaAgotado ? 0 : Number(item.stock ?? 0);

  return (
    <tr
      onClick={() => onEditar(item._id)}
      className="border-b border-border last:border-0 hover:bg-surface cursor-pointer"
    >
      <td className="pl-5 py-3 w-14">
        {item.imagenes?.[0] ? (
          <img
            src={item.imagenes[0]}
            alt={item.nombre}
            className="w-10 h-10 rounded-sm object-cover border border-border"
          />
        ) : (
          <div className="w-10 h-10 rounded-sm border border-border flex items-center justify-center text-muted">
            <ImageOff size={14} />
          </div>
        )}
      </td>
      <td className="px-3 py-4 text-text max-w-[180px]">
        <p className="truncate" title={item.nombre}>{item.nombre}</p>
        <p className="text-xs text-muted truncate">
          {item.marca || "Sin marca"}
          {item.talla && item.talla !== "N/A" ? ` - ${item.talla}` : ""}
        </p>
      </td>
      <td className="px-5 py-4">
        <div className="flex gap-1 flex-wrap">
          {(item.categorias || []).map((c) => (
            <span key={c._id} className="text-xs px-2 py-0.5 rounded-sm border border-border text-muted">
              {c.nombre}
            </span>
          ))}
        </div>
      </td>
      <td className="px-5 py-4 text-muted">{item.lote?.numLot ?? "--"}</td>
      <td className="px-5 py-4 text-right">
        <span className={`font-medium ${estaAgotado ? "text-negative" : "text-text"}`}>
          {stockVisible}
        </span>
      </td>
      <td className="px-5 py-4 text-right text-muted">
        ${Number(item.costo || 0).toLocaleString()}
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {perdida && <TriangleAlert size={13} className="text-negative" />}
          <span className={perdida ? "text-negative" : "text-text"}>
            ${Number(item.precioMercado || 0).toLocaleString()}
          </span>
        </div>
      </td>
      <td className="px-5 py-4 text-right">
        <span className={`text-xs px-2 py-1 rounded-sm border ${estadoColor[item.estado] || "text-muted border-border"}`}>
          {item.estado}
        </span>
      </td>
      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-3">
          <button onClick={() => onEditar(item._id)} className="text-xs text-accent hover:underline">
            Editar
          </button>
          <button onClick={() => onEliminar(item)} className="text-xs text-negative hover:underline">
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}

function PanelFiltros({ filtroEstado, setFiltroEstado, filtroCategoria, setFiltroCategoria, categoriasDisponibles }) {
  const filtrosActivos = (filtroEstado !== "Todos") + (filtroCategoria !== "Todas");

  const opcionesEstado = [
    { value: "Todos", label: "Todos" },
    { value: "Disponible", label: "Disponible" },
    { value: "Agotado", label: "Agotado" },
    { value: "Apartado", label: "Apartado" },
    { value: "Vendido", label: "Vendido" },
  ];

  const opcionesCategoria = categoriasDisponibles.map((c) => ({
    value: c._id,
    label: c.nombre,
  }));

  return (
    <div className="absolute right-0 top-full mt-1 z-10 w-64 bg-surface border border-border rounded-sm shadow-lg p-4 space-y-3">
      <Campo label="Estado">
        <SelectNativo
          value={filtroEstado}
          onChange={setFiltroEstado}
          options={opcionesEstado}
          placeholder="Todos"
        />
      </Campo>
      <Campo label="Categoria">
        <SelectNativo
          value={filtroCategoria}
          onChange={setFiltroCategoria}
          options={opcionesCategoria}
          placeholder="Todas"
        />
      </Campo>
      {filtrosActivos > 0 && (
        <button
          onClick={() => {
            setFiltroEstado("Todos");
            setFiltroCategoria("Todas");
          }}
          className="text-xs text-accent hover:underline"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

const COLUMNAS = [
  { label: "Producto", colSpan: 2 },
  { label: "Categoria" },
  { label: "Lote" },
  { label: "Stock", className: "text-right" },
  { label: "Costo", className: "text-right" },
  { label: "Venta", className: "text-right" },
  { label: "Estado", className: "text-right" },
  { label: "Acciones", className: "text-right" },
];

function Inventario() {
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [panelFiltrosAbierto, setPanelFiltrosAbierto] = useState(false);

  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && productoAEliminar) {
        setProductoAEliminar(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [productoAEliminar]);

  const handleConfirmarEliminar = async () => {
    if (!productoAEliminar) return;
    try {
      setEliminando(true);
      setErrorEliminar(null);
      await eliminarProducto(productoAEliminar._id);
      setProductos((prev) => prev.filter((p) => p._id !== productoAEliminar._id));
      setProductoAEliminar(null);
    } catch {
      setErrorEliminar("No se pudo eliminar el producto.");
    } finally {
      setEliminando(false);
    }
  };

  const cargarProductos = useCallback(async () => {
    try {
      setCargando(true);
      const data = await getProductos();
      console.log(data);
      const normalizados = data.map((item) => ({
        ...item,
        estado: derivarEstado(item),
      }));
      setProductos(normalizados);
      setError(null);
    } catch {
      setError("No se pudo cargar el inventario.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const categoriasDisponibles = useMemo(() => {
    const mapa = new Map();
    productos.forEach((p) => (p.categorias || []).forEach((c) => mapa.set(c._id, c.nombre)));
    return Array.from(mapa, ([_id, nombre]) => ({ _id, nombre }));
  }, [productos]);

  const filtrado = useMemo(() => {
    const busquedaLower = busqueda.toLowerCase();
    return productos.filter((item) => {
      if (busquedaLower && !item.nombre?.toLowerCase().includes(busquedaLower)) return false;
      if (filtroEstado !== "Todos" && item.estado !== filtroEstado) return false;
      if (filtroCategoria !== "Todas" && !(item.categorias || []).some((c) => c._id === filtroCategoria)) return false;
      return true;
    });
  }, [productos, busqueda, filtroEstado, filtroCategoria]);

  const stats = useMemo(() => {
    let disponibles = 0;
    let valorInventario = 0;
    let gananciaPotencial = 0;

    for (const item of productos) {
      const estaAgotado = item.activo === false || item.activo === "false" || item.estado === "Agotado" || item.estado === "Vendido" || Number(item.stock || 0) <= 0;
      if (item.estado === "Disponible" && !estaAgotado) {
        disponibles++;
      }
      if (!estaAgotado) {
        const costo = Number(item.costo || 0);
        const venta = Number(item.precioMercado || 0);
        const stock = Number(item.stock || 0);
        valorInventario += costo;
        gananciaPotencial += (venta - costo) * stock;
      }
    }

    return { disponibles, valorInventario, gananciaPotencial };
  }, [productos]);

  const filtrosActivos = (filtroEstado !== "Todos") + (filtroCategoria !== "Todas");

  const irARegistrar = () => navigate("/inventario/newProduct");
  const irAEditar = (id) => navigate(`/inventario/editar/${id}`);

  const exportarCSV = useCallback(() => {
    const encabezados = ["Nombre", "Marca", "Talla", "Lote", "Stock", "Costo", "Venta", "Margen", "Estado"];
    const filas = filtrado.map((item) => {
      const estaAgotado = item.activo === false || item.activo === "false" || Number(item.stock || 0) <= 0;
      const stockVisible = estaAgotado ? 0 : Number(item.stock || 0);
      return [
        item.nombre,
        item.marca || "",
        item.talla || "",
        item.lote?.numLot ?? "",
        stockVisible,
        item.costo || 0,
        item.precioMercado || 0,
        (Number(item.precioMercado || 0) - Number(item.costo || 0)).toFixed(2),
        item.estado,
      ];
    });

    const csv = [encabezados, ...filas]
      .map((fila) => fila.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventario.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, [filtrado]);

  if (error) {
    return (
      <DashboardLayout>
        <p className="text-negative">{error}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-text">Inventario</h1>
          <p className="text-muted mt-1">Pares disponibles agrupados por lote.</p>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <TarjetaStat titulo="Total de pares" valor={productos.length} />
        <TarjetaStat titulo="Disponibles" valor={stats.disponibles} />
        <TarjetaStat titulo="Valor en inventario" valor={`$${stats.valorInventario.toLocaleString()}`} />
        <TarjetaStat
          titulo="Ganancia potencial"
          valor={`$${stats.gananciaPotencial.toLocaleString()}`}
          className={stats.gananciaPotencial < 0 ? "text-negative" : "text-positive"}
        />
      </section>

      <div className="flex gap-2 mb-4">
        <Button variante="primary" icono={Plus} onClick={irARegistrar} className="px-5">
          Registrar producto
        </Button>
        <Button icono={RefreshCw} onClick={cargarProductos}>
          Actualizar
        </Button>
        <Button icono={Download} onClick={exportarCSV}>
          Exportar
        </Button>
      </div>

      <div className="flex gap-3 mb-4 relative">
        <input
          type="text"
          placeholder="Buscar por nombre"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted focus:outline-none focus:border-accent"
        />
        <button
          onClick={() => setPanelFiltrosAbierto((prev) => !prev)}
          className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-sm border transition-colors ${filtrosActivos > 0
            ? "border-accent text-accent"
            : "border-border text-muted hover:bg-surface"
            }`}
        >
          <SlidersHorizontal size={14} />
          Filtros
          {filtrosActivos > 0 && (
            <span className="w-4 h-4 flex items-center justify-center rounded-full bg-accent text-white text-[10px]">
              {filtrosActivos}
            </span>
          )}
        </button>

        {panelFiltrosAbierto && (
          <PanelFiltros
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            filtroCategoria={filtroCategoria}
            setFiltroCategoria={setFiltroCategoria}
            categoriasDisponibles={categoriasDisponibles}
          />
        )}
      </div>

      <div className="border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface  text-muted text-left border-b border-border">
              {COLUMNAS.map((col) => (
                <th
                  key={col.label}
                  colSpan={col.colSpan}
                  className={`px-5 py-3 font-normal ${col.className || ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando &&
              Array.from({ length: 5 }).map((_, i) => <FilaEsqueleto key={i} />)}

            {!cargando &&
              filtrado.map((item) => (
                <FilaProducto
                  key={item._id}
                  item={item}
                  onEditar={irAEditar}
                  onEliminar={setProductoAEliminar}
                />
              ))}

            {!cargando && filtrado.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-8 text-center text-muted">
                  No se encontraron pares con ese criterio.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmacion de eliminacion */}
      {productoAEliminar && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-modal-eliminar"
        >
          <div className="bg-surface border border-border rounded-sm max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-negative">
              <div className="p-2 rounded-full bg-negative/10">
                <Trash2 size={20} />
              </div>
              <h2 id="titulo-modal-eliminar" className="text-lg font-semibold text-text">
                Eliminar producto
              </h2>
            </div>
            <p className="text-sm text-muted">
              ¿Estas seguro de que deseas eliminar <strong className="text-text">{productoAEliminar.nombre}</strong>? Esta accion desactivara el producto del inventario.
            </p>
            {errorEliminar && (
              <p className="text-xs text-negative">{errorEliminar}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductoAEliminar(null)}
                disabled={eliminando}
                className="text-sm text-muted px-4 py-2 rounded-sm border border-border hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                disabled={eliminando}
                className="flex items-center gap-2 bg-negative text-white text-sm px-4 py-2 rounded-sm hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-negative transition-opacity"
              >
                {eliminando && <Loader2 className="animate-spin" size={14} />}
                <span>{eliminando ? "Eliminando..." : "Si, eliminar"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Inventario;