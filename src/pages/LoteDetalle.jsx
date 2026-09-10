import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  getLotePorId,
  actualizarInversionLote,
  actualizarEstadoLote,
  eliminarLote,
} from "../services/lotService";
import { getProductosPorLote, crearProducto } from "../services/productService";
import { getCategorias } from "../services/categoryService";

function calcularInversion(desglose) {
  if (!desglose) return 0;
  const { mercancia = 0, viaticos = 0, gasolina = 0, otros = 0 } = desglose;
  return Number(mercancia) + Number(viaticos) + Number(gasolina) + Number(otros);
}

const generos = ["hombre", "mujer", "unisex"];

function LoteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lote, setLote] = useState(null);
  const [cargandoLote, setCargandoLote] = useState(true);
  const [errorLote, setErrorLote] = useState(null);

  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorProductos, setErrorProductos] = useState(null);

  const [categorias, setCategorias] = useState([]);

  const [formInversion, setFormInversion] = useState({
    mercancia: "",
    viaticos: "",
    gasolina: "",
    otros: "",
  });

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    marca: "",
    genero: "",
    talla: "",
    stock: "",
    costo: "",
    precioMercado: "",
    categorias: [],
    imagenes: [],
  });

  const cargarLote = async () => {
    try {
      setCargandoLote(true);
      const data = await getLotePorId(id);
      if (!data) {
        setErrorLote("Lote no encontrado.");
        return;
      }
      setLote(data);
      setErrorLote(null);
    } catch {
      setErrorLote("No se pudo cargar el lote.");
    } finally {
      setCargandoLote(false);
    }
  };

  const cargarProductos = async () => {
    try {
      setCargandoProductos(true);
      const data = await getProductosPorLote(id);
      setProductos(data);
      setErrorProductos(null);
    } catch {
      setErrorProductos("No se pudieron cargar los tenis de este lote.");
    } finally {
      setCargandoProductos(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      const data = await getCategorias();
      setCategorias(data);
    } catch {
      setCategorias([]);
    }
  };

  useEffect(() => {
    cargarLote();
    cargarProductos();
    cargarCategorias();
  }, [id]);

  const inversionTotal = calcularInversion(lote?.desgloseInversion);

  const actualizarInversion = async (e) => {
    e.preventDefault();
    const cambios = {};
    if (formInversion.mercancia) cambios.mercancia = Number(formInversion.mercancia);
    if (formInversion.viaticos) cambios.viaticos = Number(formInversion.viaticos);
    if (formInversion.gasolina) cambios.gasolina = Number(formInversion.gasolina);
    if (formInversion.otros) cambios.otros = Number(formInversion.otros);

    if (Object.keys(cambios).length === 0) return;

    try {
      await actualizarInversionLote(id, cambios);
      setFormInversion({ mercancia: "", viaticos: "", gasolina: "", otros: "" });
      cargarLote();
    } catch {
      alert("No se pudo actualizar el desglose de inversion.");
    }
  };

  const cambiarEstado = async (nuevoEstado) => {
    try {
      await actualizarEstadoLote(id, nuevoEstado);
      cargarLote();
    } catch {
      alert("No se pudo actualizar el estado del lote.");
    }
  };

  const desactivarLote = async () => {
    if (!confirm("Esto marcara el lote como inactivo. Continuar?")) return;
    try {
      await eliminarLote(id);
      navigate("/lotes");
    } catch {
      alert("No se pudo desactivar el lote.");
    }
  };

  const toggleCategoria = (categoriaId) => {
    setNuevoProducto((prev) => {
      const yaSeleccionada = prev.categorias.includes(categoriaId);
      return {
        ...prev,
        categorias: yaSeleccionada
          ? prev.categorias.filter((c) => c !== categoriaId)
          : [...prev.categorias, categoriaId],
      };
    });
  };

  const agregarProducto = async (e) => {
    e.preventDefault();

    console.log("Nuevo producto:", nuevoProducto);

    if (
      !nuevoProducto.nombre ||
      !nuevoProducto.genero ||
      !nuevoProducto.costo ||
      !nuevoProducto.precioMercado ||
      nuevoProducto.categorias.length === 0
    ) {
      alert("Completa nombre, genero, costo, precio de mercado y al menos una categoria.");
      return;
    }

    if (nuevoProducto.imagenes.length === 0) {
      alert("Debes subir al menos una imagen del producto.");
      return;
    }

    const formData = new FormData();
    formData.append("nombre", nuevoProducto.nombre);
    formData.append("marca", nuevoProducto.marca);
    formData.append("lote", id);
    formData.append("categorias", JSON.stringify(nuevoProducto.categorias));
    formData.append("genero", nuevoProducto.genero);
    formData.append("talla", nuevoProducto.talla);
    formData.append("stock", nuevoProducto.stock || 0);
    formData.append("costo", nuevoProducto.costo);
    formData.append("precioMercado", nuevoProducto.precioMercado);

    nuevoProducto.imagenes.forEach((archivo) => {
      formData.append("imagenes", archivo);
    });

    try {
      await crearProducto(formData);

      setNuevoProducto({
        nombre: "",
        marca: "",
        genero: "",
        talla: "",
        stock: "",
        costo: "",
        precioMercado: "",
        categorias: [],
        imagenes: [],
      });

      cargarProductos();
    } catch {
      alert("No se pudo agregar el par de tenis.");
    }
  };

  if (cargandoLote) {
    return (
      <DashboardLayout>
        <p className="text-muted">Cargando lote...</p>
      </DashboardLayout>
    );
  }

  if (errorLote) {
    return (
      <DashboardLayout>
        <p className="text-negative">{errorLote}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <header className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate("/lotes")}
            className="text-muted text-sm hover:text-text mb-2"
          >
            Volver a lotes
          </button>
          <h1 className="font-display text-3xl text-text">{lote.numLot}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => cambiarEstado(lote.estado === "activo" ? "inactivo" : "activo")}
            className="border border-border text-muted px-4 py-2 rounded-sm text-sm hover:text-text"
          >
            {lote.estado === "activo" ? "Marcar inactivo" : "Marcar activo"}
          </button>
          <button
            onClick={desactivarLote}
            className="border border-negative text-negative px-4 py-2 rounded-sm text-sm hover:bg-negative hover:text-bg transition-colors"
          >
            Eliminar lote
          </button>
        </div>
      </header>

      <section className="grid grid-cols-4 gap-4 mb-10">
        <div className="border border-border rounded-sm bg-surface px-5 py-4">
          <p className="text-muted text-sm">Inversion total</p>
          <p className="font-display text-2xl mt-1 text-text">
            ${inversionTotal.toLocaleString()}
          </p>
        </div>
        <div className="border border-border rounded-sm bg-surface px-5 py-4">
          <p className="text-muted text-sm">Ventas</p>
          <p className="font-display text-2xl mt-1 text-muted">Sin datos aun</p>
        </div>
        <div className="border border-border rounded-sm bg-surface px-5 py-4">
          <p className="text-muted text-sm">Ganancia</p>
          <p className="font-display text-2xl mt-1 text-muted">Sin datos aun</p>
        </div>
        <div className="border border-border rounded-sm bg-surface px-5 py-4">
          <p className="text-muted text-sm">Recuperado</p>
          <p className="font-display text-2xl mt-1 text-muted">Sin datos aun</p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-8">
        <section>
          <h2 className="font-display text-xl text-text mb-4">Desglose de inversion</h2>
          <div className="border border-border rounded-sm overflow-hidden mb-4">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-3 text-text">Mercancia</td>
                  <td className="px-4 py-3 text-right text-muted">
                    ${Number(lote.desgloseInversion?.mercancia || 0).toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-3 text-text">Viaticos</td>
                  <td className="px-4 py-3 text-right text-muted">
                    ${Number(lote.desgloseInversion?.viaticos || 0).toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-3 text-text">Gasolina</td>
                  <td className="px-4 py-3 text-right text-muted">
                    ${Number(lote.desgloseInversion?.gasolina || 0).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-text">Otros</td>
                  <td className="px-4 py-3 text-right text-muted">
                    ${Number(lote.desgloseInversion?.otros || 0).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <form onSubmit={actualizarInversion} className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Nueva mercancia"
              value={formInversion.mercancia}
              onChange={(e) => setFormInversion({ ...formInversion, mercancia: e.target.value })}
              className="bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
            />
            <input
              type="number"
              placeholder="Nuevos viaticos"
              value={formInversion.viaticos}
              onChange={(e) => setFormInversion({ ...formInversion, viaticos: e.target.value })}
              className="bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
            />
            <input
              type="number"
              placeholder="Nueva gasolina"
              value={formInversion.gasolina}
              onChange={(e) => setFormInversion({ ...formInversion, gasolina: e.target.value })}
              className="bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
            />
            <input
              type="number"
              placeholder="Otros nuevos"
              value={formInversion.otros}
              onChange={(e) => setFormInversion({ ...formInversion, otros: e.target.value })}
              className="bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
            />
            <button
              type="submit"
              className="col-span-2 border border-accent text-accent py-2 rounded-sm text-sm hover:bg-accent hover:text-bg transition-colors"
            >
              Actualizar inversion
            </button>
          </form>
        </section>

        <section>
          <h2 className="font-display text-xl text-text mb-4">Tenis de este lote</h2>

          {cargandoProductos && <p className="text-muted text-sm mb-4">Cargando tenis...</p>}
          {errorProductos && <p className="text-negative text-sm mb-4">{errorProductos}</p>}

          {!cargandoProductos && !errorProductos && (
            <div className="border border-border rounded-sm overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface text-muted text-left border-b border-border">
                    <th className="px-4 py-2 font-normal">Modelo</th>
                    <th className="px-4 py-2 font-normal text-right">Costo</th>
                    <th className="px-4 py-2 font-normal text-right">Precio</th>
                    <th className="px-4 py-2 font-normal text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto._id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-text">
                        {producto.nombre}
                        <span className="text-muted"> / {producto.talla}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted">
                        ${Number(producto.costo).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-muted">
                        ${Number(producto.precioMercado).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-text">{producto.stock}</td>
                    </tr>
                  ))}
                  {productos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted">
                        Aun no hay tenis en este lote.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <form onSubmit={agregarProducto} className="grid grid-cols-2 gap-2">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) =>
                setNuevoProducto({ ...nuevoProducto, imagenes: Array.from(e.target.files) })
              }
              className="col-span-2 bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text"
            />
            <input
              type="text"
              placeholder="Nombre"
              value={nuevoProducto.nombre}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
              className="bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
            />
            <input
              type="text"
              placeholder="Marca"
              value={nuevoProducto.marca}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, marca: e.target.value })}
              className="bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
            />
            <select
              value={nuevoProducto.genero}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, genero: e.target.value })}
              className="bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text"
            >
              <option value="">Genero</option>
              {generos.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Talla"
              value={nuevoProducto.talla}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, talla: e.target.value })}
              className="bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
            />
            <input
              type="number"
              placeholder="Stock"
              value={nuevoProducto.stock}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock: e.target.value })}
              className="bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
            />
            <input
              type="number"
              placeholder="Costo"
              value={nuevoProducto.costo}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, costo: e.target.value })}
              className="bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
            />
            <input
              type="number"
              placeholder="Precio de mercado"
              value={nuevoProducto.precioMercado}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, precioMercado: e.target.value })}
              className="col-span-2 bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
            />

            <div className="col-span-2">
              <p className="text-muted text-sm mb-2">Categorias</p>
              <div className="flex flex-wrap gap-2">
                {categorias.map((categoria) => (
                  <button
                    type="button"
                    key={categoria._id}
                    onClick={() => toggleCategoria(categoria._id)}
                    className={`text-xs px-3 py-1 rounded-sm border ${nuevoProducto.categorias.includes(categoria._id)
                      ? "border-accent text-accent"
                      : "border-border text-muted"
                      }`}
                  >
                    {categoria.nombre}
                  </button>
                ))}
                {categorias.length === 0 && (
                  <span className="text-muted text-xs">No hay categorias registradas.</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="col-span-2 border border-accent text-accent py-2 rounded-sm text-sm hover:bg-accent hover:text-bg transition-colors"
            >
              Agregar tenis a este lote
            </button>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default LoteDetalle;