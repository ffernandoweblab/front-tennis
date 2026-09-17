import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Tag,
  ToggleLeft,
  ToggleRight,
  Package,
  FolderOpen,
  RefreshCw,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import TarjetaStat from "../components/ui/TarjetaStat";
import Button from "../components/ui/Button";
import Campo from "../components/form/Campo";
import inputClass from "../components/form/inputClass";
import {
  getCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "../services/categoryService";
import { getProductos } from "../services/productService";

const CAMPOS_DISPONIBLES = [
  { key: "nombre", label: "Nombre" },
  { key: "marca", label: "Marca" },
  { key: "genero", label: "Genero" },
  { key: "descripcion", label: "Descripcion" },
  { key: "talla", label: "Talla" },
  { key: "stock", label: "Stock" },
  { key: "precioMercado", label: "Precio de mercado" },
  { key: "costo", label: "Costo" },
  { key: "imagenes", label: "Imagenes" },
  { key: "variantes", label: "Variantes" },
];

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  // Busqueda
  const [busqueda, setBusqueda] = useState("");

  // Modal crear/editar
  const [modal, setModal] = useState({
    abierto: false,
    editando: null,
    nombre: "",
    camposRequeridos: {
      nombre: true,
      marca: true,
      genero: true,
      descripcion: true,
      talla: true,
      stock: true,
      precioMercado: true,
      costo: true,
      imagenes: true,
      variantes: true,
    },
    guardando: false,
  });

  // Modal de confirmacion de eliminacion
  const [modalEliminar, setModalEliminar] = useState({
    abierto: false,
    categoria: null,
    eliminando: false,
  });

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const [dataCategorias, dataProductos] = await Promise.all([
        getCategorias(),
        getProductos(),
      ]);
      setCategorias(Array.isArray(dataCategorias) ? dataCategorias : []);
      setProductos(Array.isArray(dataProductos) ? dataProductos : []);
    } catch {
      setError("No se pudieron cargar las categorias.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Contar productos por categoria
  const conteoProductos = useMemo(() => {
    const conteo = {};
    for (const prod of productos) {
      const cats = prod.categorias || [];
      for (const catId of cats) {
        const id = typeof catId === "object" ? catId._id : catId;
        conteo[id] = (conteo[id] || 0) + 1;
      }
    }
    return conteo;
  }, [productos]);

  // Metricas
  const metricas = useMemo(() => {
    const total = categorias.length;
    const conProductos = categorias.filter(
      (c) => (conteoProductos[c._id] || 0) > 0
    ).length;
    const sinProductos = total - conProductos;
    const totalProductosAsignados = Object.values(conteoProductos).reduce(
      (acc, v) => acc + v,
      0
    );
    return { total, conProductos, sinProductos, totalProductosAsignados };
  }, [categorias, conteoProductos]);

  // Filtro
  const categoriasFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return categorias;
    return categorias.filter((c) =>
      (c.nombre || "").toLowerCase().includes(q)
    );
  }, [categorias, busqueda]);

  // Abrir modal para crear
  const abrirModalCrear = () => {
    setModal({
      abierto: true,
      editando: null,
      nombre: "",
      camposRequeridos: {
        nombre: true,
        marca: true,
        genero: true,
        descripcion: true,
        talla: true,
        stock: true,
        precioMercado: true,
        costo: true,
        imagenes: true,
        variantes: true,
      },
      guardando: false,
    });
  };

  // Abrir modal para editar
  const abrirModalEditar = (categoria) => {
    setModal({
      abierto: true,
      editando: categoria,
      nombre: categoria.nombre || "",
      camposRequeridos: {
        nombre: categoria.camposRequeridos?.nombre ?? true,
        marca: categoria.camposRequeridos?.marca ?? true,
        genero: categoria.camposRequeridos?.genero ?? true,
        descripcion: categoria.camposRequeridos?.descripcion ?? true,
        talla: categoria.camposRequeridos?.talla ?? true,
        stock: categoria.camposRequeridos?.stock ?? true,
        precioMercado: categoria.camposRequeridos?.precioMercado ?? true,
        costo: categoria.camposRequeridos?.costo ?? true,
        imagenes: categoria.camposRequeridos?.imagenes ?? true,
        variantes: categoria.camposRequeridos?.variantes ?? true,
      },
      guardando: false,
    });
  };

  // Cerrar modal
  const cerrarModal = () => {
    setModal((prev) => ({ ...prev, abierto: false }));
  };

  // Toggle campo requerido
  const toggleCampo = (key) => {
    setModal((prev) => ({
      ...prev,
      camposRequeridos: {
        ...prev.camposRequeridos,
        [key]: !prev.camposRequeridos[key],
      },
    }));
  };

  // Guardar (crear o editar)
  const handleGuardar = async (e) => {
    e.preventDefault();
    const nombre = modal.nombre.trim();
    if (!nombre) {
      setError("El nombre de la categoria es obligatorio.");
      return;
    }

    try {
      setModal((prev) => ({ ...prev, guardando: true }));
      setError(null);

      if (modal.editando) {
        await actualizarCategoria(modal.editando._id, {
          nombre,
          camposRequeridos: modal.camposRequeridos,
        });
        setExito("Categoria actualizada correctamente.");
      } else {
        await crearCategoria({
          nombre,
          camposRequeridos: modal.camposRequeridos,
        });
        setExito("Categoria creada correctamente.");
      }

      cerrarModal();
      cargarDatos();
      setTimeout(() => setExito(null), 4000);
    } catch (err) {
      const mensaje =
        err?.response?.data?.message || "No se pudo guardar la categoria.";
      setError(mensaje);
      setModal((prev) => ({ ...prev, guardando: false }));
    }
  };

  // Eliminar
  const handleEliminar = async () => {
    if (!modalEliminar.categoria) return;

    try {
      setModalEliminar((prev) => ({ ...prev, eliminando: true }));
      setError(null);

      await eliminarCategoria(modalEliminar.categoria._id);

      setModalEliminar({ abierto: false, categoria: null, eliminando: false });
      setExito("Categoria eliminada correctamente.");
      cargarDatos();
      setTimeout(() => setExito(null), 4000);
    } catch (err) {
      const mensaje =
        err?.response?.data?.message || "No se pudo eliminar la categoria.";
      setError(mensaje);
      setModalEliminar((prev) => ({ ...prev, eliminando: false }));
    }
  };

  return (
    <DashboardLayout>
      {/* Encabezado */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-text">Categorias</h1>
          <p className="text-muted mt-0.5 text-sm">
            Administra las categorias de tu catalogo de calzado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            icono={RefreshCw}
            onClick={cargarDatos}
            disabled={cargando}
            className="text-xs py-1.5 px-2.5"
            title="Actualizar datos"
          >
            Refrescar
          </Button>
          <Button
            variante="primary"
            icono={Plus}
            onClick={abrirModalCrear}
            className="text-xs py-1.5 px-3"
          >
            Nueva Categoria
          </Button>
        </div>
      </header>

      {/* Alertas */}
      {error && (
        <div className="mb-6 p-4 rounded-sm border border-negative/40 bg-negative/10 flex items-center justify-between text-sm text-negative">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-negative hover:text-text text-xs p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {exito && (
        <div className="mb-6 p-4 rounded-sm border border-positive/40 bg-positive/10 flex items-center justify-between text-sm text-positive">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{exito}</span>
          </div>
          <button
            type="button"
            onClick={() => setExito(null)}
            className="text-positive hover:text-text text-xs p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tarjetas Estadisticas */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <TarjetaStat titulo="Total categorias" valor={metricas.total} />
        <TarjetaStat
          titulo="Con productos"
          valor={metricas.conProductos}
          className="text-positive"
        />
        <TarjetaStat
          titulo="Sin productos"
          valor={metricas.sinProductos}
          className="text-muted"
        />
        <TarjetaStat
          titulo="Productos asignados"
          valor={metricas.totalProductosAsignados}
          className="text-accent"
        />
      </section>

      {/* Barra de busqueda */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar categoria por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`${inputClass(false)} pl-9 py-2 text-sm placeholder-muted/60`}
          />
        </div>
      </div>

      {/* Tabla de Categorias */}
      <section className="border border-border rounded-sm overflow-hidden bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-muted text-left border-b border-border">
              <th className="px-5 py-3 font-normal">Categoria</th>
              <th className="px-5 py-3 font-normal text-center">Productos</th>
              <th className="px-5 py-3 font-normal">Campos requeridos</th>
              <th className="px-5 py-3 font-normal text-center">Fecha</th>
              <th className="px-5 py-3 font-normal text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-muted">
                  Cargando categorias...
                </td>
              </tr>
            )}

            {!cargando && categoriasFiltradas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-muted">
                  <FolderOpen size={28} className="mx-auto mb-2 opacity-50" />
                  {busqueda
                    ? "No se encontraron categorias con esa busqueda."
                    : "Aun no hay categorias registradas."}
                </td>
              </tr>
            )}

            {!cargando &&
              categoriasFiltradas.map((cat) => {
                const numProductos = conteoProductos[cat._id] || 0;
                const camposActivos = cat.camposRequeridos
                  ? Object.entries(cat.camposRequeridos)
                      .filter(
                        ([key, val]) => val === true && key !== "_id"
                      )
                      .map(([key]) => {
                        const campo = CAMPOS_DISPONIBLES.find(
                          (c) => c.key === key
                        );
                        return campo ? campo.label : key;
                      })
                  : [];

                const fechaStr = cat.createdAt
                  ? new Date(cat.createdAt).toLocaleDateString()
                  : "--";

                return (
                  <tr
                    key={cat._id}
                    className="border-b border-border last:border-0 hover:bg-background/40 transition-colors"
                  >
                    {/* Nombre */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-sm bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                          <Tag size={16} />
                        </div>
                        <span className="font-medium text-text">
                          {cat.nombre}
                        </span>
                      </div>
                    </td>

                    {/* Cantidad de productos */}
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Package size={13} className="text-muted" />
                        <span
                          className={`font-medium ${
                            numProductos > 0 ? "text-text" : "text-muted"
                          }`}
                        >
                          {numProductos}
                        </span>
                      </div>
                    </td>

                    {/* Campos requeridos */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {camposActivos.length > 0 ? (
                          camposActivos.map((campo) => (
                            <span
                              key={campo}
                              className="text-[10px] px-1.5 py-0.5 rounded-sm bg-bg border border-border text-muted"
                            >
                              {campo}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted">
                            Sin campos configurados
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className="px-5 py-4 text-center text-muted text-xs">
                      {fechaStr}
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => abrirModalEditar(cat)}
                          className="p-1.5 rounded-sm text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                          title="Editar categoria"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setModalEliminar({
                              abierto: true,
                              categoria: cat,
                              eliminando: false,
                            })
                          }
                          className="p-1.5 rounded-sm text-muted hover:text-negative hover:bg-negative/10 transition-colors"
                          title="Eliminar categoria"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </section>

      {/* Modal Crear/Editar Categoria */}
      {modal.abierto && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-sm max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in duration-200">
            {/* Header del modal */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-accent" />
                <h3 className="font-display text-lg text-text">
                  {modal.editando ? "Editar Categoria" : "Nueva Categoria"}
                </h3>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                className="text-muted hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-4">
              {/* Nombre */}
              <Campo label="Nombre de la categoria" required>
                <input
                  type="text"
                  placeholder="Ej: Tenis deportivo, Bota, Sandalia..."
                  value={modal.nombre}
                  onChange={(e) =>
                    setModal({ ...modal, nombre: e.target.value })
                  }
                  className={`${inputClass(false)} px-3 py-2 text-sm placeholder-muted/60`}
                  required
                  autoFocus
                />
              </Campo>

              {/* Campos requeridos */}
              <div>
                <p className="text-xs font-medium text-muted mb-2">
                  Campos requeridos para productos de esta categoria
                </p>
                <p className="text-[11px] text-muted/70 mb-3">
                  Activa los campos que seran obligatorios al registrar un producto con esta categoria.
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {CAMPOS_DISPONIBLES.map((campo) => {
                    const activo = modal.camposRequeridos[campo.key];
                    return (
                      <button
                        key={campo.key}
                        type="button"
                        onClick={() => toggleCampo(campo.key)}
                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-sm border text-xs transition-all ${
                          activo
                            ? "border-accent/40 bg-accent/5 text-text"
                            : "border-border bg-bg text-muted hover:border-border hover:text-text"
                        }`}
                      >
                        <span className="font-medium">{campo.label}</span>
                        {activo ? (
                          <ToggleRight
                            size={18}
                            className="text-accent shrink-0"
                          />
                        ) : (
                          <ToggleLeft
                            size={18}
                            className="text-muted/40 shrink-0"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-2">
                <Button
                  variante="ghost"
                  onClick={cerrarModal}
                  className="flex-1 justify-center"
                >
                  Cancelar
                </Button>
                <Button
                  tipo="submit"
                  variante="primary"
                  disabled={modal.guardando}
                  className="flex-1 justify-center"
                >
                  {modal.guardando
                    ? "Guardando..."
                    : modal.editando
                    ? "Guardar Cambios"
                    : "Crear Categoria"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmacion para Eliminar */}
      {modalEliminar.abierto && modalEliminar.categoria && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-sm max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in duration-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-negative/10 border border-negative/30 rounded-full flex items-center justify-center mx-auto text-negative mb-2">
                <Trash2 size={22} />
              </div>
              <h3 className="font-display text-lg text-text">
                Eliminar Categoria
              </h3>
              <p className="text-sm text-muted">
                Estas seguro de eliminar la categoria{" "}
                <span className="font-semibold text-text">
                  {modalEliminar.categoria.nombre}
                </span>
                ?
              </p>
              {(conteoProductos[modalEliminar.categoria._id] || 0) > 0 && (
                <div className="mt-2 p-2.5 rounded-sm bg-accent/10 border border-accent/30 text-xs text-accent">
                  Esta categoria tiene{" "}
                  <span className="font-bold">
                    {conteoProductos[modalEliminar.categoria._id]}
                  </span>{" "}
                  producto(s) asignados. No se podra eliminar hasta reasignarlos.
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variante="ghost"
                onClick={() =>
                  setModalEliminar({
                    abierto: false,
                    categoria: null,
                    eliminando: false,
                  })
                }
                className="flex-1 justify-center"
              >
                Cancelar
              </Button>
              <Button
                variante="danger"
                icono={Trash2}
                onClick={handleEliminar}
                disabled={modalEliminar.eliminando}
                className="flex-1 justify-center"
              >
                {modalEliminar.eliminando ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Categorias;