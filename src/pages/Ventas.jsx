import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Package,
  DollarSign,
  CreditCard,
  User,
  Phone,
  Calendar,
  X,
  RefreshCw,
  Receipt,
  Printer,
  Clock,
  ArrowRight,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import TarjetaStat from "../components/ui/TarjetaStat";
import Button from "../components/ui/Button";
import Campo from "../components/form/Campo";
import SelectNativo from "../components/form/SelectNativo";
import inputClass from "../components/form/inputClass";
import CampoMoneda from "../components/ui/CampoMoneda";
import { getVentas, crearVenta, registrarAbono } from "../services/saleService";
import { getProductos } from "../services/productService";

function Ventas() {
  const [pestanaActiva, setPestanaActiva] = useState("terminal"); // "terminal" | "historial"
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  // Filtros de terminal
  const [busquedaCatalogo, setBusquedaCatalogo] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("Todas");

  // Carrito / Ticket de venta actual
  const [carrito, setCarrito] = useState([]);
  const [datosCliente, setDatosCliente] = useState({
    nombre: "",
    telefono: "",
  });
  const [tipoPago, setTipoPago] = useState("Contado"); // "Contado" | "Apartado"
  const [medioPago, setMedioPago] = useState("Efectivo"); // "Efectivo" | "Transferencia"
  const [montoRecibido, setMontoRecibido] = useState("");
  const [anticipoAbono, setAnticipoAbono] = useState("");
  const [diasApartado, setDiasApartado] = useState("15");
  const [fechaLimitePersonalizada, setFechaLimitePersonalizada] = useState("");
  const [folioTransferencia, setFolioTransferencia] = useState("");

  // Modal para abonar
  const [modalAbono, setModalAbono] = useState({
    abierto: false,
    venta: null,
    monto: "",
    medioPago: "Efectivo",
    folio: "",
    guardando: false,
  });

  // Modal ticket generado
  const [ticketModal, setTicketModal] = useState({
    abierto: false,
    venta: null,
    cambio: 0,
  });

  // Filtros de historial
  const [busquedaHistorial, setBusquedaHistorial] = useState("");
  const [filtroEstadoHistorial, setFiltroEstadoHistorial] = useState("todos");

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const [dataVentas, dataProductos] = await Promise.all([
        getVentas(),
        getProductos(),
      ]);

      setVentas(Array.isArray(dataVentas) ? dataVentas : []);
      setProductos(Array.isArray(dataProductos) ? dataProductos : []);
    } catch {
      setError("No se pudieron cargar los datos de ventas o inventario.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Productos disponibles con stock
  const productosDisponibles = useMemo(() => {
    return productos.filter((p) => p.activo !== false && Number(p.stock || 0) > 0);
  }, [productos]);

  // Marcas únicas disponibles para filtro rápido
  const marcasDisponibles = useMemo(() => {
    const setMarcas = new Set();
    for (const p of productosDisponibles) {
      if (p.marca && p.marca.trim()) {
        setMarcas.add(p.marca.trim());
      }
    }
    return ["Todas", ...Array.from(setMarcas)];
  }, [productosDisponibles]);

  // Catálogo filtrado en la terminal
  const catalogoFiltrado = useMemo(() => {
    return productosDisponibles.filter((prod) => {
      const coincideMarca =
        filtroMarca === "Todas" ||
        (prod.marca || "").toLowerCase() === filtroMarca.toLowerCase();

      const q = busquedaCatalogo.toLowerCase().trim();
      if (!q) return coincideMarca;

      const nombreCoincide = (prod.nombre || "").toLowerCase().includes(q);
      const marcaCoincide = (prod.marca || "").toLowerCase().includes(q);
      const tallaCoincide = String(prod.talla || "").toLowerCase().includes(q);

      return coincideMarca && (nombreCoincide || marcaCoincide || tallaCoincide);
    });
  }, [productosDisponibles, filtroMarca, busquedaCatalogo]);

  // Cantidad de veces que un producto está en el carrito
  const cantidadEnCarrito = useCallback(
    (prodId) => {
      return carrito.filter((item) => String(item._id) === String(prodId)).length;
    },
    [carrito]
  );

  // Agregar al carrito
  const agregarAlCarrito = (producto) => {
    const yaAgregados = cantidadEnCarrito(producto._id);
    if (yaAgregados >= Number(producto.stock || 0)) {
      setError(`No hay más stock disponible para ${producto.nombre} (Stock: ${producto.stock})`);
      return;
    }
    setCarrito((prev) => [...prev, producto]);
    setError(null);
  };

  // Remover un elemento del carrito por índice
  const removerDelCarrito = (index) => {
    setCarrito((prev) => prev.filter((_, i) => i !== index));
  };

  // Limpiar carrito
  const limpiarCarrito = () => {
    setCarrito([]);
    setMontoRecibido("");
    setAnticipoAbono("");
    setFolioTransferencia("");
    setDatosCliente({ nombre: "", telefono: "" });
  };

  // Totales del carrito
  const totalCarrito = useMemo(() => {
    return carrito.reduce((acc, p) => acc + Number(p.precioMercado || 0), 0);
  }, [carrito]);

  // Cambio a devolver en efectivo
  const cambioEfectivo = useMemo(() => {
    if (tipoPago !== "Contado" || medioPago !== "Efectivo") return 0;
    const recibido = Number(montoRecibido || 0);
    if (recibido <= totalCarrito) return 0;
    return recibido - totalCarrito;
  }, [montoRecibido, totalCarrito, tipoPago, medioPago]);

  // Saldo pendiente si es apartado o abono
  const saldoPendienteCalculado = useMemo(() => {
    if (tipoPago !== "Apartado" && tipoPago !== "Abonos") return 0;
    const anticipo = Number(anticipoAbono || 0);
    return Math.max(0, totalCarrito - anticipo);
  }, [tipoPago, anticipoAbono, totalCarrito]);

  // Fecha calculada de vencimiento del apartado
  const fechaVencimientoApartado = useMemo(() => {
    if (tipoPago !== "Apartado" && tipoPago !== "Abonos") return null;
    if (diasApartado === "personalizado") {
      return fechaLimitePersonalizada ? new Date(`${fechaLimitePersonalizada}T23:59:59`) : null;
    }
    const d = new Date();
    d.setDate(d.getDate() + Number(diasApartado || 15));
    return d;
  }, [tipoPago, diasApartado, fechaLimitePersonalizada]);

  // Procesar cobro del ticket
  const handleCobrarTicket = async (e) => {
    e.preventDefault();
    if (carrito.length === 0) {
      setError("El ticket de venta está vacío. Agrega al menos un par de tenis.");
      return;
    }
    if (!datosCliente.nombre.trim()) {
      setError("Ingresa el nombre del cliente para registrar la venta.");
      return;
    }

    const esContado = tipoPago === "Contado";
    const montoCobrado = esContado ? totalCarrito : Number(anticipoAbono || 0);

    if (!esContado && montoCobrado <= 0) {
      setError("Ingresa el monto del anticipo inicial para el apartado.");
      return;
    }

    if (!esContado && montoCobrado > totalCarrito) {
      setError("El anticipo no puede exceder el total de la venta.");
      return;
    }

    if (esContado && medioPago === "Efectivo" && montoRecibido && Number(montoRecibido) < totalCarrito) {
      setError(`El monto recibido ($${Number(montoRecibido).toLocaleString()}) es menor al total ($${totalCarrito.toLocaleString()}).`);
      return;
    }

    try {
      setGuardando(true);
      setError(null);

      const primerAbono = {
        monto: montoCobrado,
        medioPago,
        fecha: new Date(),
        folio: folioTransferencia.trim() || undefined,
      };

      const idsProductos = carrito.map((p) => p._id);

      const ventaPayload = {
        idProductos: idsProductos,
        cliente: datosCliente.nombre.trim(),
        telefonoCliente: datosCliente.telefono.trim(),
        tipoPago,
        numeroMontos: 1,
        montoPagado: montoCobrado,
        totalAPagar: totalCarrito,
        estado: montoCobrado >= totalCarrito ? "pagado" : "pendiente",
        abonos: [primerAbono],
        diasApartado: tipoPago === "Apartado" && diasApartado !== "personalizado" ? Number(diasApartado) : undefined,
        fechaLimiteApartado: (tipoPago === "Apartado" || tipoPago === "Abonos") && fechaVencimientoApartado ? fechaVencimientoApartado.toISOString() : undefined,
      };

      const nuevaVenta = await crearVenta(ventaPayload);

      // Descontar inventario local
      setProductos((prev) =>
        prev.map((p) => {
          const vecesVendida = idsProductos.filter((id) => String(id) === String(p._id)).length;
          if (vecesVendida > 0) {
            const nuevoStock = Math.max(0, Number(p.stock || 0) - vecesVendida);
            return {
              ...p,
              stock: nuevoStock,
              activo: nuevoStock > 0,
            };
          }
          return p;
        })
      );

      setVentas((prev) => [nuevaVenta, ...prev]);

      const cambioFinal = cambioEfectivo;

      // Abrir modal de ticket exitoso
      setTicketModal({
        abierto: true,
        venta: nuevaVenta,
        cambio: cambioFinal,
      });

      limpiarCarrito();
      setExito("Venta procesada con éxito.");
      setTimeout(() => setExito(null), 4000);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al procesar la venta. Intenta nuevamente.");
    } finally {
      setGuardando(false);
    }
  };

  // Registrar abono desde el modal
  const handleGuardarAbono = async (e) => {
    e.preventDefault();
    const { venta, monto, medioPago: medio, folio } = modalAbono;
    if (!venta) return;

    const montoNum = Number(monto);
    const saldoPendiente = Number(venta.totalAPagar || 0) - Number(venta.montoPagado || 0);

    if (montoNum <= 0) {
      setError("Ingresa un monto de abono válido.");
      return;
    }

    if (montoNum > saldoPendiente) {
      setError(`El abono máximo permitido es $${saldoPendiente.toLocaleString()}`);
      return;
    }

    try {
      setModalAbono((prev) => ({ ...prev, guardando: true }));
      setError(null);

      const abonoData = {
        monto: montoNum,
        medioPago: medio,
        fecha: new Date(),
        folio: folio.trim() || undefined,
      };

      const ventaActualizada = await registrarAbono(venta._id, abonoData);

      setVentas((prev) =>
        prev.map((v) => (v._id === venta._id ? ventaActualizada : v))
      );

      setModalAbono({
        abierto: false,
        venta: null,
        monto: "",
        medioPago: "Efectivo",
        folio: "",
        guardando: false,
      });

      setExito("Abono registrado correctamente.");
      setTimeout(() => setExito(null), 4000);
    } catch (err) {
      console.error(err);
      setError("No se pudo registrar el abono.");
      setModalAbono((prev) => ({ ...prev, guardando: false }));
    }
  };

  // Métricas para historial
  const metricas = useMemo(() => {
    let cobradoTotal = 0;
    let pendienteTotal = 0;
    let volumenTotal = 0;
    let apartadosPendientes = 0;

    for (const v of ventas) {
      const pagado = Number(v.montoPagado || 0);
      const total = Number(v.totalAPagar || pagado || 0);
      const pendiente = Math.max(total - pagado, 0);

      cobradoTotal += pagado;
      volumenTotal += total;
      if (v.estado !== "cancelado") {
        pendienteTotal += pendiente;
      }
      if (v.estado === "pendiente" || pendiente > 0) {
        apartadosPendientes++;
      }
    }

    return {
      cobradoTotal,
      pendienteTotal,
      volumenTotal,
      cantidadVentas: ventas.length,
      apartadosPendientes,
    };
  }, [ventas]);

  // Filtrado de historial
  const ventasFiltradas = useMemo(() => {
    return ventas.filter((v) => {
      const coincideEstado =
        filtroEstadoHistorial === "todos"
          ? true
          : filtroEstadoHistorial === "pagado"
          ? v.estado === "pagado" || Number(v.montoPagado || 0) >= Number(v.totalAPagar || 0)
          : v.estado === "pendiente" && Number(v.montoPagado || 0) < Number(v.totalAPagar || 0);

      const q = busquedaHistorial.toLowerCase().trim();
      if (!q) return coincideEstado;

      const clienteCoincide = (v.cliente || "").toLowerCase().includes(q);
      const telCoincide = (v.telefonoCliente || "").toLowerCase().includes(q);

      const productosCoinciden = (v.idProductos || []).some((prod) => {
        if (!prod || typeof prod !== "object") return false;
        return (
          (prod.nombre || "").toLowerCase().includes(q) ||
          (prod.marca || "").toLowerCase().includes(q)
        );
      });

      return coincideEstado && (clienteCoincide || telCoincide || productosCoinciden);
    });
  }, [ventas, filtroEstadoHistorial, busquedaHistorial]);

  return (
    <DashboardLayout>
      {/* Encabezado y Selector de Pestañas */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-text">Punto de Venta</h1>
          <p className="text-muted mt-0.5 text-sm">
            Terminal de cobro ágil, venta de calzado y control de apartados.
          </p>
        </div>

        {/* Pestañas */}
        <div className="flex items-center gap-2 bg-surface border border-border p-1 rounded-sm">
          <button
            type="button"
            onClick={() => setPestanaActiva("terminal")}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-medium transition-colors ${
              pestanaActiva === "terminal"
                ? "bg-accent text-bg font-semibold shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            <ShoppingCart size={15} />
            <span>Terminal POS</span>
            {carrito.length > 0 && (
              <span className="bg-bg text-accent font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                {carrito.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva("historial")}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-medium transition-colors ${
              pestanaActiva === "historial"
                ? "bg-accent text-bg font-semibold shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            <Clock size={15} />
            <span>Historial y Apartados</span>
            {metricas.apartadosPendientes > 0 && (
              <span className="bg-negative/20 text-negative font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                {metricas.apartadosPendientes}
              </span>
            )}
          </button>

          <Button
            icono={RefreshCw}
            onClick={cargarDatos}
            disabled={cargando}
            className="text-xs py-1.5 px-2.5 ml-1"
            title="Actualizar datos"
          >
            Refrescar
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

      {/* VISTA 1: TERMINAL POS (Catálogo + Ticket de Cobro) */}
      {pestanaActiva === "terminal" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Lado Izquierdo: Catálogo de Tenis (7 columnas) */}
          <section className="lg:col-span-7 space-y-4">
            {/* Barra de Filtros del Catálogo */}
            <div className="border border-border rounded-sm bg-surface p-3.5 space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por modelo, marca o talla (ej: Nike, Jordan 27)..."
                  value={busquedaCatalogo}
                  onChange={(e) => setBusquedaCatalogo(e.target.value)}
                  className={`${inputClass(false)} pl-9 py-2 text-sm placeholder-muted/60`}
                />
              </div>

              {/* Chips de Marcas */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                <span className="text-muted shrink-0 mr-1 text-[11px] uppercase tracking-wider">
                  Marca:
                </span>
                {marcasDisponibles.map((marca) => (
                  <button
                    key={marca}
                    type="button"
                    onClick={() => setFiltroMarca(marca)}
                    className={`px-3 py-1 rounded-sm shrink-0 transition-colors ${
                      filtroMarca === marca
                        ? "bg-accent text-bg font-semibold"
                        : "bg-bg text-muted border border-border hover:text-text"
                    }`}
                  >
                    {marca}
                  </button>
                ))}
              </div>
            </div>

            {/* Cuadrícula de Calzado */}
            <div className="border border-border rounded-sm bg-surface p-4 min-h-[420px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-text">
                  Calzado en inventario ({catalogoFiltrado.length})
                </h3>
                <span className="text-xs text-muted">
                  Haz clic en un par para agregarlo al ticket
                </span>
              </div>

              {cargando ? (
                <div className="py-20 text-center text-sm text-muted">
                  Cargando catálogo de tenis...
                </div>
              ) : catalogoFiltrado.length === 0 ? (
                <div className="py-20 text-center text-muted text-sm space-y-2">
                  <Package size={32} className="mx-auto opacity-40" />
                  <p>No se encontraron pares con los filtros aplicados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {catalogoFiltrado.map((prod) => {
                    const agregados = cantidadEnCarrito(prod._id);
                    const sinStock = agregados >= Number(prod.stock || 0);

                    return (
                      <div
                        key={prod._id}
                        onClick={() => !sinStock && agregarAlCarrito(prod)}
                        className={`border rounded-sm p-2.5 transition-all flex flex-col justify-between group ${
                          sinStock
                            ? "border-border/40 bg-bg/40 opacity-50 cursor-not-allowed"
                            : "border-border bg-bg hover:border-accent hover:shadow-md cursor-pointer"
                        }`}
                      >
                        <div>
                          {/* Foto */}
                          <div className="w-full aspect-square rounded-sm overflow-hidden bg-surface mb-2 relative flex items-center justify-center border border-border">
                            {prod.imagenes?.[0] ? (
                              <img
                                src={prod.imagenes[0]}
                                alt={prod.nombre}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <Package size={24} className="text-muted" />
                            )}
                            {agregados > 0 && (
                              <span className="absolute top-1.5 right-1.5 bg-accent text-bg text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                                en ticket ({agregados})
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <p
                            className="font-medium text-xs text-text truncate"
                            title={prod.nombre}
                          >
                            {prod.nombre}
                          </p>
                          <p className="text-[11px] text-muted truncate">
                            {prod.marca || "General"} • Talla {prod.talla || "N/A"}
                          </p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                          <span className="text-xs font-bold text-accent">
                            ${Number(prod.precioMercado || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-muted">
                            Stock: {Math.max(0, Number(prod.stock || 0) - agregados)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Lado Derecho: Ticket / Carrito de Venta (5 columnas) */}
          <section className="lg:col-span-5 space-y-4">
            <div className="border border-border rounded-sm bg-surface p-5 space-y-4 sticky top-4 shadow-xl">
              {/* Cabecera del ticket */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Receipt size={18} className="text-accent" />
                  <h2 className="font-display text-lg text-text">Ticket de Venta</h2>
                  {carrito.length > 0 && (
                    <span className="text-xs text-muted">
                      ({carrito.length} {carrito.length === 1 ? "par" : "pares"})
                    </span>
                  )}
                </div>
                {carrito.length > 0 && (
                  <button
                    type="button"
                    onClick={limpiarCarrito}
                    className="text-xs text-muted hover:text-negative flex items-center gap-1 transition-colors"
                    title="Vaciar ticket"
                  >
                    <Trash2 size={13} />
                    <span>Vaciar</span>
                  </button>
                )}
              </div>

              {/* Lista de pares en el ticket */}
              <div className="max-h-[180px] overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                {carrito.length === 0 ? (
                  <div className="py-8 text-center text-muted text-xs border border-dashed border-border rounded-sm space-y-1">
                    <ShoppingCart size={24} className="mx-auto opacity-40 mb-1" />
                    <p className="font-medium text-text">El ticket esta vacio</p>
                    <p className="text-muted text-[11px]">
                      Selecciona calzado del catalogo para comenzar a cobrar
                    </p>
                  </div>
                ) : (
                  carrito.map((item, index) => (
                    <div
                      key={`cart-item-${index}`}
                      className="p-2 rounded-sm bg-bg border border-border flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.imagenes?.[0] ? (
                          <img
                            src={item.imagenes[0]}
                            alt={item.nombre}
                            className="w-10 h-10 rounded-sm object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-sm border border-border flex items-center justify-center text-muted shrink-0 bg-surface">
                            <Package size={16} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-text truncate" title={item.nombre}>
                            {item.nombre}
                          </p>
                          <p className="text-[11px] text-muted truncate">
                            {item.marca} • Talla: {item.talla || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-text">
                          ${Number(item.precioMercado || 0).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => removerDelCarrito(index)}
                          className="text-muted hover:text-negative p-1 transition-colors"
                          title="Quitar par"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Formulario de Cobro */}
              <form onSubmit={handleCobrarTicket} className="space-y-3 pt-2 border-t border-border">
                {/* Datos del Cliente con Campo e inputClass */}
                <div className="grid grid-cols-2 gap-2">
                  <Campo label="Cliente" required>
                    <div className="relative">
                      <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Nombre cliente"
                        value={datosCliente.nombre}
                        onChange={(e) =>
                          setDatosCliente({ ...datosCliente, nombre: e.target.value })
                        }
                        className={`${inputClass(false)} pl-7 pr-2 py-1.5 text-xs placeholder-muted/60`}
                        required
                      />
                    </div>
                  </Campo>

                  <Campo label="WhatsApp / Celular">
                    <div className="relative">
                      <Phone size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Teléfono"
                        value={datosCliente.telefono}
                        onChange={(e) =>
                          setDatosCliente({ ...datosCliente, telefono: e.target.value })
                        }
                        className={`${inputClass(false)} pl-7 pr-2 py-1.5 text-xs placeholder-muted/60`}
                      />
                    </div>
                  </Campo>
                </div>

                {/* Modalidad + Medio de Pago con SelectNativo */}
                <div className="grid grid-cols-2 gap-2">
                  <Campo label="Modalidad">
                    <SelectNativo
                      value={tipoPago}
                      onChange={setTipoPago}
                      options={[
                        { value: "Contado", label: "Contado" },
                        { value: "Apartado", label: "Apartado" },
                      ]}
                      placeholder="Modalidad"
                    />
                  </Campo>

                  <Campo label="Medio de pago">
                    <SelectNativo
                      value={medioPago}
                      onChange={setMedioPago}
                      options={[
                        { value: "Efectivo", label: "Efectivo" },
                        { value: "Transferencia", label: "Transferencia" },
                      ]}
                      placeholder="Medio de pago"
                    />
                  </Campo>
                </div>

                {/* CAJA REGISTRADORA: Display + Billetes + Teclado numerico */}
                {tipoPago === "Contado" && medioPago === "Efectivo" && (
                  <div className="rounded-sm border border-border bg-bg overflow-hidden">
                    {/* Display tipo caja registradora */}
                    <div className="border-b border-border px-3 py-2.5 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-muted uppercase tracking-widest">Total</span>
                        <span className="font-display text-2xl font-bold text-accent">
                          ${totalCarrito.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-muted uppercase tracking-widest">Recibido</span>
                        <span className={`font-display text-xl font-bold transition-colors ${
                          Number(montoRecibido || 0) >= totalCarrito && montoRecibido
                            ? "text-positive"
                            : Number(montoRecibido || 0) > 0
                            ? "text-text"
                            : "text-muted/40"
                        }`}>
                          ${Number(montoRecibido || 0).toLocaleString()}
                        </span>
                      </div>
                      {cambioEfectivo > 0 && (
                        <div className="pt-1.5 border-t border-positive/30 flex items-baseline justify-between">
                          <span className="text-[10px] font-bold text-positive uppercase tracking-widest">Cambio</span>
                          <span className="font-display text-xl font-bold text-positive">
                            ${cambioEfectivo.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Billetes rapidos MX */}
                    <div className="px-2 pt-2 pb-1.5 border-b border-border">
                      <p className="text-[9px] text-muted mb-1.5 uppercase tracking-wider">Billetes rapidos</p>
                      <div className="grid grid-cols-5 gap-1">
                        {[50, 100, 200, 500, 1000].map((billete) => (
                          <button
                            key={billete}
                            type="button"
                            onClick={() => setMontoRecibido(String(billete))}
                            className={`py-1.5 rounded-sm text-[10px] font-bold border transition-all hover:scale-105 active:scale-95 ${
                              Number(montoRecibido) === billete
                                ? "border-accent bg-accent/15 text-accent"
                                : "border-border bg-surface text-muted hover:border-accent/60 hover:text-text"
                            }`}
                          >
                            ${billete}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setMontoRecibido(String(totalCarrito))}
                        className={`mt-1 w-full py-1.5 rounded-sm text-[10px] font-semibold border transition-all hover:scale-100 active:scale-95 ${
                          Number(montoRecibido) === totalCarrito && montoRecibido
                            ? "border-positive bg-positive/15 text-positive"
                            : "border-border bg-surface text-muted hover:border-positive/60 hover:text-positive"
                        }`}
                      >
                        Exacto — ${totalCarrito.toLocaleString()}
                      </button>
                    </div>

                    {/* Teclado numerico */}
                    <div className="p-2">
                      <div className="grid grid-cols-3 gap-1">
                        {["1","2","3","4","5","6","7","8","9","000","0","⌫"].map((tecla) => (
                          <button
                            key={tecla}
                            type="button"
                            onClick={() => {
                              if (tecla === "⌫") {
                                setMontoRecibido((prev) => prev.slice(0, -1));
                              } else if (tecla === "000") {
                                setMontoRecibido((prev) => (prev === "" || prev === "0" ? prev : prev + "000"));
                              } else {
                                setMontoRecibido((prev) => {
                                  const nuevo = prev + tecla;
                                  return String(Number(nuevo));
                                });
                              }
                            }}
                            className={`py-3 rounded-sm text-sm font-bold border transition-all hover:scale-105 active:scale-95 select-none ${
                              tecla === "⌫"
                                ? "border-negative/30 bg-negative/10 text-negative hover:bg-negative/20"
                                : tecla === "000"
                                ? "border-border bg-bg text-muted hover:text-text hover:border-accent/40"
                                : "border-border bg-bg text-text hover:bg-surface hover:border-accent/40"
                            }`}
                          >
                            {tecla}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Si es Transferencia: Folio + total */}
                {medioPago === "Transferencia" && (
                  <div className="space-y-2">
                    <Campo label="Folio / Referencia">
                      <input
                        type="text"
                        placeholder="Numero de autorizacion"
                        value={folioTransferencia}
                        onChange={(e) => setFolioTransferencia(e.target.value)}
                        className={`${inputClass(false)} px-3 py-1.5 text-xs placeholder-muted/60`}
                      />
                    </Campo>
                    <div className="p-2.5 rounded-sm bg-bg border border-border flex items-baseline justify-between">
                      <span className="text-xs text-muted">Total a transferir:</span>
                      <span className="font-display text-xl font-bold text-accent">
                        ${totalCarrito.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Apartado / Abonos: Anticipo + Vigencia/Tiempo + Billetes rapidos */}
                {(tipoPago === "Apartado" || tipoPago === "Abonos") && (
                  <div className="rounded-sm border border-border bg-bg overflow-hidden">
                    <div className="p-2.5 space-y-2.5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-muted uppercase tracking-widest">Total del apartado</span>
                        <span className="font-display text-xl font-bold text-accent">
                          ${totalCarrito.toLocaleString()}
                        </span>
                      </div>

                      <Campo label="Anticipo entregado" required>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">$</span>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            placeholder="Monto que deja el cliente"
                            value={anticipoAbono}
                            onChange={(e) => setAnticipoAbono(e.target.value)}
                            className={`${inputClass(false)} pl-6 pr-3 py-1.5 text-xs placeholder-muted/60`}
                            required
                          />
                        </div>
                      </Campo>

                      {/* Vigencia / Tiempo del apartado */}
                      <div className="pt-2 border-t border-border space-y-2">
                        <Campo label="Vigencia del apartado" required>
                          <SelectNativo
                            value={diasApartado}
                            onChange={setDiasApartado}
                            options={[
                              { value: "7", label: "7 dias (1 semana)" },
                              { value: "15", label: "15 dias (quincena)" },
                              { value: "30", label: "30 dias (1 mes)" },
                              { value: "45", label: "45 dias" },
                              { value: "personalizado", label: "Fecha personalizada..." },
                            ]}
                            placeholder="Selecciona vigencia"
                          />
                        </Campo>

                        {diasApartado === "personalizado" && (
                          <Campo label="Fecha limite exacta" required>
                            <input
                              type="date"
                              value={fechaLimitePersonalizada}
                              onChange={(e) => setFechaLimitePersonalizada(e.target.value)}
                              className={`${inputClass(false)} py-1.5 text-xs`}
                              required
                            />
                          </Campo>
                        )}

                        {fechaVencimientoApartado && (
                          <div className="p-2 rounded-sm bg-accent/10 border border-accent/30 flex items-center justify-between text-xs">
                            <span className="text-muted flex items-center gap-1.5">
                              <Calendar size={13} className="text-accent" />
                              Vence el:
                            </span>
                            <span className="font-semibold text-accent">
                              {fechaVencimientoApartado.toLocaleDateString(undefined, {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                      </div>

                      {anticipoAbono && (
                        <div className="flex justify-between text-xs pt-1 border-t border-border">
                          <span className="text-muted">Saldo restante por liquidar:</span>
                          <span className="text-accent font-semibold">
                            ${saldoPendienteCalculado.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="px-2 pb-2 border-t border-border pt-2">
                      <p className="text-[9px] text-muted mb-1.5 uppercase tracking-wider">Anticipo rapido</p>
                      <div className="grid grid-cols-5 gap-1">
                        {[50, 100, 200, 500, 1000].map((billete) => (
                          <button
                            key={billete}
                            type="button"
                            onClick={() => setAnticipoAbono(String(billete))}
                            className={`py-1.5 rounded-sm text-[10px] font-bold border transition-all hover:scale-105 active:scale-95 ${
                              Number(anticipoAbono) === billete
                                ? "border-accent bg-accent/15 text-accent"
                                : "border-border bg-surface text-muted hover:border-accent/60 hover:text-text"
                            }`}
                          >
                            ${billete}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Grande (oculto cuando el display ya lo muestra en efectivo/contado) */}
                {!(tipoPago === "Contado" && medioPago === "Efectivo") && (
                  <div className="pt-3 border-t border-border flex justify-between items-baseline">
                    <span className="text-sm font-medium text-text">Total a Pagar:</span>
                    <span className="font-display text-2xl text-accent font-bold">
                      ${totalCarrito.toLocaleString()}
                    </span>
                  </div>
                )}

                <Button
                  tipo="submit"
                  variante="primary"
                  icono={ArrowRight}
                  disabled={guardando || carrito.length === 0}
                  className="w-full justify-center py-2.5 text-sm font-semibold"
                >
                  {guardando ? "Procesando cobro..." : "Completar Cobro"}
                </Button>
              </form>
            </div>
          </section>
        </div>
      )}

      {/* VISTA 2: HISTORIAL Y CONTROL DE APARTADOS */}
      {pestanaActiva === "historial" && (
        <div className="space-y-6">
          {/* Tarjetas Estadísticas */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <TarjetaStat
              titulo="Total ventas recaudado"
              valor={`$${metricas.cobradoTotal.toLocaleString()}`}
              className="text-positive"
            />
            <TarjetaStat
              titulo="Saldo en apartados"
              valor={`$${metricas.pendienteTotal.toLocaleString()}`}
              className="text-accent"
            />
            <TarjetaStat
              titulo="Volumen total vendido"
              valor={`$${metricas.volumenTotal.toLocaleString()}`}
            />
            <TarjetaStat
              titulo="Transacciones registradas"
              valor={metricas.cantidadVentas}
            />
          </section>

          {/* Tabla de Historial con Buscador */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="font-display text-xl text-text">Registro de Transacciones</h2>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar cliente o calzado..."
                    value={busquedaHistorial}
                    onChange={(e) => setBusquedaHistorial(e.target.value)}
                    className={`${inputClass(false)} pl-8 pr-3 py-2 text-xs placeholder-muted/60 w-48 sm:w-60`}
                  />
                </div>

                <div className="w-44">
                  <SelectNativo
                    value={filtroEstadoHistorial}
                    onChange={setFiltroEstadoHistorial}
                    options={[
                      { value: "todos", label: "Todos los estados" },
                      { value: "pagado", label: "Liquidados (Pagados)" },
                      { value: "pendiente", label: "Apartados (Pendientes)" },
                    ]}
                    placeholder="Seleccionar estado"
                  />
                </div>
              </div>
            </div>

            <div className="border border-border rounded-sm overflow-hidden bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface text-muted text-left border-b border-border">
                    <th className="px-4 py-3 font-normal">Calzado vendido</th>
                    <th className="px-4 py-3 font-normal">Cliente</th>
                    <th className="px-4 py-3 font-normal text-right">Total</th>
                    <th className="px-4 py-3 font-normal text-right">Cobrado</th>
                    <th className="px-4 py-3 font-normal text-right">Saldo</th>
                    <th className="px-4 py-3 font-normal text-center">Estado</th>
                    <th className="px-4 py-3 font-normal text-right">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-muted">
                        Cargando ventas...
                      </td>
                    </tr>
                  )}

                  {!cargando && ventasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-muted">
                        <Receipt size={28} className="mx-auto mb-2 opacity-50" />
                        No se encontraron ventas registradas.
                      </td>
                    </tr>
                  )}

                  {!cargando &&
                    ventasFiltradas.map((venta) => {
                      const productosVenta = venta.idProductos || [];
                      const primerProd = productosVenta[0];
                      const totalPares = productosVenta.length;

                      const esLiquidado =
                        venta.estado === "pagado" ||
                        Number(venta.montoPagado || 0) >= Number(venta.totalAPagar || 0);

                      const saldo = Math.max(
                        0,
                        Number(venta.totalAPagar || 0) - Number(venta.montoPagado || 0)
                      );

                      const fechaStr = venta.createdAt
                        ? new Date(venta.createdAt).toLocaleDateString()
                        : venta.fecha
                        ? new Date(venta.fecha).toLocaleDateString()
                        : "--";

                      return (
                        <tr
                          key={venta._id}
                          className="border-b border-border last:border-0 hover:bg-background/40 transition-colors"
                        >
                          {/* Producto */}
                          <td className="px-4 py-3 text-text">
                            <div className="flex items-center gap-2.5">
                              {primerProd?.imagenes?.[0] ? (
                                <img
                                  src={primerProd.imagenes[0]}
                                  alt={primerProd.nombre}
                                  className="w-9 h-9 rounded-sm object-cover border border-border shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-sm border border-border flex items-center justify-center text-muted shrink-0 bg-background/50">
                                  <Package size={14} />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium truncate text-xs sm:text-sm text-text">
                                  {primerProd?.nombre || "Venta de calzado"}
                                  {totalPares > 1 && (
                                    <span className="text-accent font-semibold ml-1.5 text-xs">
                                      (+{totalPares - 1} más)
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-muted truncate">
                                  {primerProd?.marca || ""}
                                  {primerProd?.talla ? ` • Talla ${primerProd.talla}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Cliente */}
                          <td className="px-4 py-3">
                            <p className="text-text font-medium text-xs sm:text-sm">
                              {venta.cliente || "Cliente Mostrador"}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted">
                              <Calendar size={11} />
                              <span>{fechaStr}</span>
                              {venta.telefonoCliente && (
                                <span>• {venta.telefonoCliente}</span>
                              )}
                            </div>
                            {venta.fechaLimiteApartado && (
                              <div className="mt-1">
                                {(() => {
                                  const hoy = new Date();
                                  const fLim = new Date(venta.fechaLimiteApartado);
                                  const dif = Math.ceil((fLim - hoy) / (1000 * 60 * 60 * 24));
                                  if (esLiquidado) {
                                    return (
                                      <span className="text-[10px] text-muted">
                                        Plazo: {fLim.toLocaleDateString()}
                                      </span>
                                    );
                                  }
                                  if (dif < 0) {
                                    return (
                                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-sm bg-negative/15 text-negative border border-negative/30 font-semibold">
                                        Vencido ({Math.abs(dif)}d) • {fLim.toLocaleDateString()}
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-sm bg-accent/15 text-accent border border-accent/30 font-medium">
                                      Vence en {dif === 0 ? "hoy" : `${dif} dias`} ({fLim.toLocaleDateString()})
                                    </span>
                                  );
                                })()}
                              </div>
                            )}
                          </td>

                          {/* Total */}
                          <td className="px-4 py-3 text-right text-muted text-xs sm:text-sm">
                            ${Number(venta.totalAPagar || 0).toLocaleString()}
                          </td>

                          {/* Cobrado */}
                          <td className="px-4 py-3 text-right text-text font-medium text-xs sm:text-sm">
                            ${Number(venta.montoPagado || 0).toLocaleString()}
                          </td>

                          {/* Saldo restante */}
                          <td className="px-4 py-3 text-right text-xs sm:text-sm">
                            {saldo > 0 ? (
                              <span className="text-accent font-semibold">
                                ${saldo.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted">$0</span>
                            )}
                          </td>

                          {/* Estado */}
                          <td className="px-4 py-3 text-center">
                            {esLiquidado ? (
                              <span className="inline-block text-[11px] px-2 py-0.5 rounded-sm border border-positive/40 bg-positive/10 text-positive font-medium">
                                Liquidado
                              </span>
                            ) : (
                              <span className="inline-block text-[11px] px-2 py-0.5 rounded-sm border border-accent/40 bg-accent/10 text-accent font-medium">
                                Apartado
                              </span>
                            )}
                          </td>

                          {/* Acción */}
                          <td className="px-4 py-3 text-right">
                            {!esLiquidado ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setModalAbono({
                                    abierto: true,
                                    venta,
                                    monto: "",
                                    medioPago: "Efectivo",
                                    folio: "",
                                    guardando: false,
                                  })
                                }
                                className="text-xs px-2.5 py-1 rounded-sm border border-accent text-accent hover:bg-accent hover:text-bg transition-colors font-medium whitespace-nowrap"
                              >
                                Abonar
                              </button>
                            ) : (
                              <span className="text-xs text-muted flex items-center justify-end gap-1">
                                <CheckCircle2 size={13} className="text-positive" />
                                Pagado
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Modal para Registrar Abono */}
      {modalAbono.abierto && modalAbono.venta && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-sm max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-accent" />
                <h3 className="font-display text-lg text-text">Registrar Abono</h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  setModalAbono({
                    abierto: false,
                    venta: null,
                    monto: "",
                    medioPago: "Efectivo",
                    folio: "",
                    guardando: false,
                  })
                }
                className="text-muted hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            {/* Info de la venta */}
            <div className="p-3 bg-bg rounded-sm border border-border text-xs space-y-1">
              <p className="text-text font-medium">
                Cliente: <span className="font-normal">{modalAbono.venta.cliente}</span>
              </p>
              <div className="flex justify-between text-muted pt-1">
                <span>Total venta:</span>
                <span className="text-text font-medium">
                  ${Number(modalAbono.venta.totalAPagar || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Abonado hasta hoy:</span>
                <span className="text-positive font-medium">
                  ${Number(modalAbono.venta.montoPagado || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-muted border-t border-border pt-1">
                <span>Saldo pendiente:</span>
                <span className="text-accent font-bold">
                  $
                  {Math.max(
                    0,
                    Number(modalAbono.venta.totalAPagar || 0) -
                      Number(modalAbono.venta.montoPagado || 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleGuardarAbono} className="space-y-4">
              <CampoMoneda
                label="Monto a abonar"
                required
                value={modalAbono.monto}
                onChange={(e) =>
                  setModalAbono({ ...modalAbono, monto: e.target.value })
                }
                min="1"
              />

              <Campo label="Medio de pago" required>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setModalAbono({ ...modalAbono, medioPago: "Efectivo", folio: "" })
                    }
                    className={`py-2 px-3 rounded-sm text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                      modalAbono.medioPago === "Efectivo"
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted hover:text-text bg-bg"
                    }`}
                  >
                    <DollarSign size={14} />
                    Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setModalAbono({ ...modalAbono, medioPago: "Transferencia" })
                    }
                    className={`py-2 px-3 rounded-sm text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                      modalAbono.medioPago === "Transferencia"
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted hover:text-text bg-bg"
                    }`}
                  >
                    <CreditCard size={14} />
                    Transferencia
                  </button>
                </div>
              </Campo>

              {modalAbono.medioPago === "Transferencia" && (
                <Campo label="Folio de autorizacion">
                  <input
                    type="text"
                    placeholder="Referencia bancaria"
                    value={modalAbono.folio}
                    onChange={(e) =>
                      setModalAbono({ ...modalAbono, folio: e.target.value })
                    }
                    className={`${inputClass(false)} px-3 py-2 text-sm placeholder-muted/60`}
                  />
                </Campo>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variante="ghost"
                  onClick={() =>
                    setModalAbono({
                      abierto: false,
                      venta: null,
                      monto: "",
                      medioPago: "Efectivo",
                      folio: "",
                      guardando: false,
                    })
                  }
                  className="flex-1 justify-center"
                >
                  Cancelar
                </Button>
                <Button
                  tipo="submit"
                  variante="primary"
                  disabled={modalAbono.guardando}
                  className="flex-1 justify-center"
                >
                  {modalAbono.guardando ? "Guardando..." : "Confirmar Abono"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ticket de Venta Exitosa */}
      {ticketModal.abierto && ticketModal.venta && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-sm max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-positive/10 border border-positive/30 rounded-full flex items-center justify-center mx-auto text-positive mb-2">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-display text-xl text-text">Venta Completada</h3>
              <p className="text-xs text-muted">
                Comprobante de transacción #{ticketModal.venta._id.slice(-6).toUpperCase()}
              </p>
            </div>

            <div className="border-t border-b border-border py-3 space-y-2 text-xs">
              <div className="flex justify-between text-muted">
                <span>Cliente:</span>
                <span className="text-text font-medium">
                  {ticketModal.venta.cliente || "Cliente Mostrador"}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Pares vendidos:</span>
                <span className="text-text font-medium">
                  {(ticketModal.venta.idProductos || []).length} par(es)
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Total venta:</span>
                <span className="text-text font-semibold">
                  ${Number(ticketModal.venta.totalAPagar || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Monto cobrado:</span>
                <span className="text-positive font-semibold">
                  ${Number(ticketModal.venta.montoPagado || 0).toLocaleString()}
                </span>
              </div>
              {ticketModal.cambio > 0 && (
                <div className="flex justify-between text-positive font-medium pt-1 border-t border-border">
                  <span>Cambio entregado:</span>
                  <span>${ticketModal.cambio.toLocaleString()}</span>
                </div>
              )}
              {Number(ticketModal.venta.totalAPagar || 0) > Number(ticketModal.venta.montoPagado || 0) && (
                <div className="flex justify-between text-accent font-medium pt-1 border-t border-border">
                  <span>Saldo pendiente:</span>
                  <span>
                    $
                    {Math.max(
                      0,
                      Number(ticketModal.venta.totalAPagar || 0) -
                        Number(ticketModal.venta.montoPagado || 0)
                    ).toLocaleString()}
                  </span>
                </div>
              )}
              {ticketModal.venta.fechaLimiteApartado && (
                <div className="flex justify-between text-accent font-medium pt-1 border-t border-border">
                  <span>Limite para liquidar:</span>
                  <span>
                    {new Date(ticketModal.venta.fechaLimiteApartado).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variante="ghost"
                onClick={() => setTicketModal({ abierto: false, venta: null, cambio: 0 })}
                className="flex-1 justify-center text-xs"
              >
                Cerrar
              </Button>
              <Button
                variante="primary"
                icono={Printer}
                onClick={() => window.print()}
                className="flex-1 justify-center text-xs"
              >
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Ventas;