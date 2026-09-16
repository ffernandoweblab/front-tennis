import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { rellenarDatosPorImagen, crearProducto } from "../services/productService";
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
import SubidorImagenes, { MAX_IMAGENES } from "../components/ui/product/SubidorImagenes";

function validarFormulario({ form, imagenes, requiereTalla, requiereGenero }) {
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

  if (imagenes.length === 0) errores.imagenes = "Debes subir al menos una imagen.";

  return errores;
}

const CAMPOS_OBLIGATORIOS = ["nombre", "categoria", "lote", "stock", "costo", "precioMercado", "imagenes"];

function NuevoProducto() {
  const navigate = useNavigate();

  const [imagenes, setImagenes] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [analizando, setAnalizando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const [lotes, setLotes] = useState([]);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);


  const tallasPlayeras = ["XS", "S", "M", "L", "XL", "XXL"];
  const tallasTenis = ["6", "6.5", "7", "7.5", "8", "8.5"];

  const [form, setForm] = useState({
    nombre: "",
    marca: "",
    lote: "",
    categoria: "",
    genero: "",
    descripcion: "",
    stock: 1,
    talla: "N/A",
    costo: "",
    precioMercado: "",
    activo: true,
  });

  const [touched, setTouched] = useState({});
  const [intentoSubmit, setIntentoSubmit] = useState(false);

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const [lotesData, categoriasData] = await Promise.all([getLotes(), getCategorias()]);
        setLotes(lotesData);
        setCategoriasDisponibles(categoriasData);
      } catch {
        setError("No se pudieron cargar lotes y categorias.");
      }
    };
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        const formElement = document.getElementById("form-nuevo-producto");
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
    () => validarFormulario({ form, imagenes, requiereTalla, requiereGenero }),
    [form, imagenes, requiereTalla, requiereGenero]
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

  const agregarImagenes = (lista) => {
    const nuevas = Array.from(lista).filter((f) => f.type.startsWith("image/"));
    setImagenes((prev) => [...prev, ...nuevas].slice(0, MAX_IMAGENES));
    setPreviews((prev) => [...prev, ...nuevas.map((f) => URL.createObjectURL(f))].slice(0, MAX_IMAGENES));
    marcarTocado("imagenes");
  };

  const eliminarImagen = (index) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    marcarTocado("imagenes");
  };

  const handleAutocompletar = async () => {
    if (imagenes.length === 0) {
      setError("Sube al menos una imagen antes de autocompletar.");
      return;
    }
    try {
      setAnalizando(true);
      setError(null);
      const formData = new FormData();
      imagenes.slice(0, 3).forEach((file) => formData.append("imagenes", file));
      const datosIA = await rellenarDatosPorImagen(formData);
      setForm((prev) => ({
        ...prev,
        nombre: datosIA.nombre || prev.nombre,
        marca: datosIA.marca || prev.marca,
        genero: datosIA.genero || prev.genero,
        descripcion: datosIA.descripcion || prev.descripcion,
        talla: datosIA.talla || prev.talla,
        categoria: datosIA.categoria || prev.categoria,
      }));
    } catch {
      setError("No se pudo autocompletar con IA. Completa el formulario manualmente.");
    } finally {
      setAnalizando(false);
    }
  };

  const seleccionarCategoria = (id) => {
    setForm((prev) => ({
      ...prev,
      categoria: prev.categoria === id ? "" : id,
      talla: "",
    }));
    marcarTocado("categoria");
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
      Object.entries(form).forEach(([key, value]) => {
        if (key === "activo") {
          formData.append("activo", value ? "true" : "false");
        } else {
          formData.append(key, value);
        }
      });
      imagenes.forEach((file) => formData.append("imagenes", file));

      await crearProducto(formData);
      navigate("/inventario");
    } catch {
      setError("No se pudo registrar el producto.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Cabecera fija */}
      <div className="sticky top-0 z-10 -mx-6 px-6 pt-1 pb-4 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-semibold text-text">Registrar producto</h1>
            <p className="text-sm text-muted mt-0.5">
              Completa los datos o sube imagenes para autocompletarlos con IA.
            </p>
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
              form="form-nuevo-producto"
              disabled={guardando || (intentoSubmit && !esValido)}
              className="flex items-center gap-2 bg-accent text-white text-sm px-5 py-2 rounded-sm disabled:opacity-50 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-opacity"
            >
              <span>{guardando ? "Guardando..." : "Registrar producto"}</span>
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
        id="form-nuevo-producto"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start mt-4"
        noValidate
      >
        {/* Columna izquierda: imagenes */}
        <Seccion
          titulo="Imagenes"
          descripcion="La IA sugiere nombre, marca, genero, talla y categoria a partir de las fotos."
        >
          <SubidorImagenes
            imagenes={imagenes}
            previews={previews}
            onAgregar={agregarImagenes}
            onEliminar={eliminarImagen}
            error={mostrarError("imagenes")}
            onAutocompletar={handleAutocompletar}
            analizando={analizando}
          />
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

export default NuevoProducto;