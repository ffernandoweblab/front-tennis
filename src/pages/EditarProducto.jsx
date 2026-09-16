import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImageOff, Loader2, ImagePlus, X } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import { getProducto, actualizarProducto } from "../services/productService";
import { getLotes } from "../services/lotService";
import { getCategorias } from "../services/categoryService";

import Seccion from "../components/form/Seccion";
import Campo from "../components/form/Campo";
import SelectNativo from "../components/form/SelectNativo";
import inputClass from "../components/form/inputClass";
import ToggleSwitch from "../components/ui/ToggleSwitch";
import BarraProgreso from "../components/ui/BarraProgreso";
import CampoMoneda from "../components/ui/CampoMoneda";
import SelectorCategorias from "../components/ui/product/SelectorCategorias";

const MAX_IMAGENES = 6;

function validarFormulario({ form, totalImagenes, requiereTalla, requiereGenero }) {
  const errores = {};

  if (!form.nombre.trim()) {
    errores.nombre = "El nombre es obligatorio.";
  } else if (form.nombre.trim().length < 2) {
    errores.nombre = "El nombre es demasiado corto.";
  }

  if (!form.categoria) errores.categoria = "Selecciona una categoria.";
  if (!form.lote) errores.lote = "Selecciona un lote.";
  if (requiereGenero && !form.genero) errores.genero = "Esta categoria requiere especificar genero.";
  if (requiereTalla && (!form.talla || form.talla === "N/A")) {
    errores.talla = "Esta categoria requiere especificar talla.";
  }
  if (form.stock === "" || Number(form.stock) < 0) errores.stock = "El stock debe ser 0 o mayor.";

  if (form.costo === "" || Number(form.costo) <= 0) {
    errores.costo = "El costo debe ser mayor a 0.";
  } else if (form.precioMercado !== "" && Number(form.precioMercado) < Number(form.costo)) {
    errores.precioMercado = "El precio de venta no puede ser menor al costo.";
  }

  if (form.precioMercado === "" || Number(form.precioMercado) <= 0) {
    errores.precioMercado = errores.precioMercado || "El precio de venta debe ser mayor a 0.";
  }

  if (totalImagenes === 0) {
    errores.imagenes = "Debes tener al menos una imagen.";
  }

  return errores;
}

const CAMPOS_OBLIGATORIOS = ["nombre", "categoria", "lote", "stock", "costo", "precioMercado", "imagenes"];

function EditarProducto() {
  const { id } = useParams();
  const navigate = useNavigate();

  const tallasPlayeras = ["XS", "S", "M", "L", "XL", "XXL"];
  const tallasTenis = ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "12"];

  const [form, setForm] = useState({
    nombre: "",
    marca: "",
    lote: "",
    categoria: "",
    genero: "",
    descripcion: "",
    stock: 0,
    talla: "N/A",
    costo: "",
    precioMercado: "",
    activo: true,
  });

  const [imagenesExistentes, setImagenesExistentes] = useState([]);
  const [nuevasImagenes, setNuevasImagenes] = useState([]);
  const [nuevasPreviews, setNuevasPreviews] = useState([]);
  const [arrastrando, setArrastrando] = useState(false);

  const [lotes, setLotes] = useState([]);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState({});
  const [intentoSubmit, setIntentoSubmit] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        const [productoData, lotesData, categoriasData] = await Promise.all([
          getProducto(id),
          getLotes(),
          getCategorias(),
        ]);

        setLotes(lotesData);
        setCategoriasDisponibles(categoriasData);

        const catId =
          productoData.categorias?.[0]?._id ||
          productoData.categorias?.[0] ||
          productoData.categoria ||
          "";

        const loteId =
          productoData.lote?._id ||
          productoData.lote ||
          "";

        setForm({
          nombre: productoData.nombre || "",
          marca: productoData.marca || "",
          lote: loteId,
          categoria: catId,
          genero: productoData.genero || "",
          descripcion: productoData.descripcion || "",
          stock: productoData.stock ?? 0,
          talla: productoData.talla || "N/A",
          costo: productoData.costo ?? "",
          precioMercado: productoData.precioMercado ?? "",
          activo: productoData.activo ?? true,
        });

        setImagenesExistentes(productoData.imagenes || []);
        setError(null);
      } catch {
        setError("No se pudo cargar la informacion del producto.");
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        const formElement = document.getElementById("form-editar-producto");
        if (formElement) {
          formElement.requestSubmit();
        }
      } else if (e.key === "Escape") {
        navigate("/inventario");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const totalImagenes = imagenesExistentes.length + nuevasImagenes.length;

  const categoriaSeleccionada = categoriasDisponibles.find((c) => c._id === form.categoria);
  const requiereTalla = categoriaSeleccionada?.camposRequeridos?.talla ?? false;
  const requiereGenero = categoriaSeleccionada?.camposRequeridos?.genero ?? false;

  const nombreCategoria = categoriaSeleccionada?.nombre?.toLowerCase() || "";
  const esTenis = /teni|calzado|zapato/i.test(nombreCategoria);
  const esPlayera = /playera|camisa|camiseta|ropa/i.test(nombreCategoria);

  const opcionesTalla = esTenis
    ? tallasTenis
    : esPlayera
    ? tallasPlayeras
    : [];

  const errores = useMemo(
    () => validarFormulario({ form, totalImagenes, requiereTalla, requiereGenero }),
    [form, totalImagenes, requiereTalla, requiereGenero]
  );
  const esValido = Object.keys(errores).length === 0;
  const mostrarError = (campo) => (touched[campo] || intentoSubmit ? errores[campo] : undefined);
  const marcarTocado = (campo) => setTouched((prev) => ({ ...prev, [campo]: true }));

  const progreso = useMemo(() => {
    const resueltos = CAMPOS_OBLIGATORIOS.filter((c) => !errores[c]).length;
    return Math.round((resueltos / CAMPOS_OBLIGATORIOS.length) * 100);
  }, [errores]);

  const margen = useMemo(() => {
    const costo = Number(form.costo);
    const venta = Number(form.precioMercado);
    if (!costo || !venta || venta <= costo) return null;
    const ganancia = venta - costo;
    const porcentaje = Math.round((ganancia / costo) * 100);
    return { ganancia, porcentaje };
  }, [form.costo, form.precioMercado]);

  const seleccionarCategoria = (catId) => {
    setForm((prev) => ({
      ...prev,
      categoria: prev.categoria === catId ? "" : catId,
      talla: "",
    }));
    marcarTocado("categoria");
  };

  const agregarNuevasImagenes = (lista) => {
    const nuevas = Array.from(lista).filter((f) => f.type.startsWith("image/"));
    const disponibles = MAX_IMAGENES - totalImagenes;
    const seleccionadas = nuevas.slice(0, disponibles);
    if (seleccionadas.length === 0) return;

    setNuevasImagenes((prev) => [...prev, ...seleccionadas]);
    setNuevasPreviews((prev) => [...prev, ...seleccionadas.map((f) => URL.createObjectURL(f))]);
    marcarTocado("imagenes");
  };

  const eliminarImagenExistente = (index) => {
    setImagenesExistentes((prev) => prev.filter((_, i) => i !== index));
    marcarTocado("imagenes");
  };

  const eliminarImagenNueva = (index) => {
    setNuevasImagenes((prev) => prev.filter((_, i) => i !== index));
    setNuevasPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    marcarTocado("imagenes");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    if (totalImagenes >= MAX_IMAGENES) return;
    agregarNuevasImagenes(e.dataTransfer.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIntentoSubmit(true);

    if (!esValido) {
      setError("Revisa los campos marcados antes de continuar.");
      return;
    }

    try {
      setGuardando(true);
      const formData = new FormData();
      formData.append("nombre", form.nombre.trim());
      formData.append("marca", form.marca);
      formData.append("descripcion", form.descripcion);
      formData.append("lote", form.lote);
      formData.append("categoria", form.categoria);
      formData.append("genero", form.genero);
      formData.append("talla", form.talla);
      formData.append("stock", form.stock);
      formData.append("costo", form.costo);
      formData.append("precioMercado", form.precioMercado);
      formData.append("activo", form.activo ? "true" : "false");

      formData.append("imagenesExistentes", JSON.stringify(imagenesExistentes));
      nuevasImagenes.forEach((file) => formData.append("imagenes", file));

      await actualizarProducto(id, formData);
      navigate("/inventario");
    } catch {
      setError("No se pudo actualizar el producto.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-muted">
          <Loader2 className="animate-spin" size={28} />
          <p className="text-sm">Cargando producto...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Cabecera fija */}
      <div className="sticky top-0 z-10 -mx-6 px-6 pt-1 pb-4 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/inventario")}
              className="p-1.5 rounded-sm border border-border text-muted hover:text-text hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
              aria-label="Volver a inventario"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-text">Editar producto</h1>
              <p className="text-sm text-muted mt-0.5">
                Modifica los datos del producto, agrega o elimina imagenes.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/inventario")}
              className="text-sm text-muted px-4 py-2 rounded-sm border border-border hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="form-editar-producto"
              disabled={guardando || (intentoSubmit && !esValido)}
              className="flex items-center gap-2 bg-accent text-white text-sm px-5 py-2 rounded-sm disabled:opacity-50 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-opacity"
            >
              <span>{guardando ? "Guardando..." : "Guardar cambios"}</span>
              <kbd className="hidden sm:inline-block text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
                Ctrl+S
              </kbd>
            </button>
          </div>
        </div>

        <BarraProgreso porcentaje={progreso} />
      </div>

      {/* Error global */}
      {error && (
        <div className="border border-negative/40 bg-negative/5 text-negative rounded-sm px-4 py-3 my-4 text-sm">
          {error}
        </div>
      )}

      {/* Formulario */}
      <form
        id="form-editar-producto"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start mt-4"
        noValidate
      >
        {/* Columna izquierda: gestion de imagenes */}
        <Seccion
          titulo="Imagenes"
          descripcion={`Gestiona las fotos del producto (${totalImagenes}/${MAX_IMAGENES}).`}
        >
          <div className="space-y-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={handleDrop}
              className={`rounded-sm border-2 border-dashed transition-colors p-2 ${
                arrastrando ? "border-accent bg-accent/5" : "border-border"
              }`}
            >
              {totalImagenes > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {/* Imagenes ya guardadas */}
                  {imagenesExistentes.map((src, i) => (
                    <div key={`existente-${i}`} className="relative group aspect-square">
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover rounded-sm border border-border"
                      />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded-sm">
                          Principal
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => eliminarImagenExistente(i)}
                        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-negative focus:bg-negative focus:outline-none focus-visible:ring-2 focus-visible:ring-negative transition-colors"
                        aria-label={`Eliminar foto existente ${i + 1}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {/* Nuevas imagenes cargadas en esta sesion */}
                  {nuevasPreviews.map((src, i) => (
                    <div key={`nueva-${i}`} className="relative group aspect-square">
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover rounded-sm border border-accent/40"
                      />
                      <span className="absolute bottom-1 left-1 text-[10px] bg-accent text-white px-1.5 py-0.5 rounded-sm">
                        Nueva
                      </span>
                      <button
                        type="button"
                        onClick={() => eliminarImagenNueva(i)}
                        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-negative focus:bg-negative focus:outline-none focus-visible:ring-2 focus-visible:ring-negative transition-colors"
                        aria-label={`Eliminar foto nueva ${i + 1}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {/* Boton para añadir mas si hay cupo */}
                  {totalImagenes < MAX_IMAGENES && (
                    <label className="flex flex-col items-center justify-center gap-1 aspect-square rounded-sm border border-border cursor-pointer text-muted hover:border-accent hover:text-accent focus-within:ring-2 focus-within:ring-accent focus-within:border-accent transition-colors">
                      <ImagePlus size={18} />
                      <span className="text-xs">Agregar</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          agregarNuevasImagenes(e.target.files);
                          e.target.value = null;
                        }}
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 py-10 cursor-pointer text-muted hover:text-accent focus-within:ring-2 focus-within:ring-accent focus-within:border-accent transition-colors">
                  <ImagePlus size={24} />
                  <span className="text-sm">Arrastra imagenes o haz clic</span>
                  <span className="text-xs">Hasta {MAX_IMAGENES} fotos</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      agregarNuevasImagenes(e.target.files);
                      e.target.value = null;
                    }}
                    className="sr-only"
                  />
                </label>
              )}
            </div>

            {mostrarError("imagenes") && (
              <p className="text-xs text-negative">{mostrarError("imagenes")}</p>
            )}
          </div>
        </Seccion>

        {/* Columna derecha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Datos generales */}
          <Seccion titulo="Datos generales" className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Campo label="Nombre" required error={mostrarError("nombre")}>
                <input
                  autoFocus
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  onBlur={() => marcarTocado("nombre")}
                  className={inputClass(mostrarError("nombre"))}
                  placeholder="Ej. Air Max 90"
                />
              </Campo>
              <Campo label="Marca">
                <input
                  value={form.marca}
                  onChange={(e) => setForm({ ...form, marca: e.target.value })}
                  className={inputClass(false)}
                  placeholder="Ej. Nike"
                />
              </Campo>
              <Campo label="Descripcion">
                <input
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className={inputClass(false)}
                  placeholder="Detalles opcionales"
                />
              </Campo>
            </div>
          </Seccion>

          {/* Clasificacion */}
          <Seccion titulo="Clasificacion">
            <Campo label="Lote" required error={mostrarError("lote")}>
              <SelectNativo
                value={form.lote}
                onChange={(val) => setForm({ ...form, lote: val })}
                onBlur={() => marcarTocado("lote")}
                options={lotes}
                getLabel={(l) => l.numLot}
                getValue={(l) => l._id}
                error={mostrarError("lote")}
              />
            </Campo>

            <SelectorCategorias
              categorias={categoriasDisponibles}
              seleccionada={form.categoria}
              onSeleccionar={seleccionarCategoria}
              error={mostrarError("categoria")}
            />

            {requiereGenero && (
              <Campo label="Genero" required error={mostrarError("genero")}>
                <SelectNativo
                  value={form.genero}
                  onChange={(val) => setForm({ ...form, genero: val })}
                  onBlur={() => marcarTocado("genero")}
                  options={[
                    { value: "hombre", label: "Hombre" },
                    { value: "mujer", label: "Mujer" },
                    { value: "unisex", label: "Unisex" },
                  ]}
                  error={mostrarError("genero")}
                />
              </Campo>
            )}

            {requiereTalla && (
              <Campo label="Talla" required error={mostrarError("talla")}>
                {opcionesTalla.length > 0 ? (
                  <SelectNativo
                    value={form.talla === "N/A" ? "" : form.talla}
                    onChange={(val) => setForm({ ...form, talla: val })}
                    onBlur={() => marcarTocado("talla")}
                    options={opcionesTalla.map((t) => ({ value: t, label: t }))}
                    placeholder="Selecciona talla"
                    error={mostrarError("talla")}
                  />
                ) : (
                  <input
                    value={form.talla === "N/A" ? "" : form.talla}
                    onChange={(e) => setForm({ ...form, talla: e.target.value })}
                    onBlur={() => marcarTocado("talla")}
                    className={inputClass(mostrarError("talla"))}
                    placeholder="Ej. Talla"
                  />
                )}
              </Campo>
            )}
          </Seccion>

          {/* Precio e inventario */}
          <Seccion titulo="Precio e inventario">
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Stock" required error={mostrarError("stock")}>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  onBlur={() => marcarTocado("stock")}
                  className={inputClass(mostrarError("stock"))}
                />
              </Campo>

              <Campo label="Visible en catalogo">
                <ToggleSwitch
                  checked={form.activo}
                  onChange={(val) => setForm({ ...form, activo: val })}
                  labelOn="Activo"
                  labelOff="Oculto"
                />
              </Campo>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CampoMoneda
                label="Costo"
                required
                min="1"
                value={form.costo}
                onChange={(e) => setForm({ ...form, costo: e.target.value })}
                onBlur={() => marcarTocado("costo")}
                error={mostrarError("costo")}
              />
              <CampoMoneda
                label="Venta"
                required
                min="1"
                value={form.precioMercado}
                onChange={(e) => setForm({ ...form, precioMercado: e.target.value })}
                onBlur={() => marcarTocado("precioMercado")}
                error={mostrarError("precioMercado")}
                hint={margen ? `Ganancia: $${margen.ganancia} (${margen.porcentaje}%)` : undefined}
              />
            </div>
          </Seccion>
        </div>
      </form>
    </DashboardLayout>
  );
}

export default EditarProducto;
