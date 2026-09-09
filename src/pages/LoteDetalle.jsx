import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";

function LoteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [gastos, setGastos] = useState([
    { id: 1, concepto: "Compra tenis", monto: 14000 },
    { id: 2, concepto: "Envio", monto: 800 },
  ]);

  const [tenis, setTenis] = useState([
    { id: 1, modelo: "Jordan 1 Retro", talla: "8.5", costo: 2200, precioVenta: 2800, vendido: true },
    { id: 2, modelo: "Yeezy 350", talla: "9", costo: 3100, precioVenta: 3900, vendido: false },
  ]);

  const [nuevoGasto, setNuevoGasto] = useState({ concepto: "", monto: "" });
  const [nuevoTenis, setNuevoTenis] = useState({ modelo: "", talla: "", costo: "", precioVenta: "" });

  const inversionTotal = useMemo(() => {
    const totalGastos = gastos.reduce((acc, g) => acc + Number(g.monto), 0);
    const totalTenis = tenis.reduce((acc, t) => acc + Number(t.costo), 0);
    return totalGastos + totalTenis;
  }, [gastos, tenis]);

  const ventasTotal = useMemo(() => {
    return tenis
      .filter((t) => t.vendido)
      .reduce((acc, t) => acc + Number(t.precioVenta), 0);
  }, [tenis]);

  const recuperado = inversionTotal > 0
    ? Math.min(100, Math.round((ventasTotal / inversionTotal) * 100))
    : 0;

  const ganancia = ventasTotal - inversionTotal;

  const agregarGasto = (e) => {
    e.preventDefault();
    if (!nuevoGasto.concepto || !nuevoGasto.monto) return;
    setGastos([
      ...gastos,
      { id: Date.now(), concepto: nuevoGasto.concepto, monto: Number(nuevoGasto.monto) },
    ]);
    setNuevoGasto({ concepto: "", monto: "" });
  };

  const agregarTenis = (e) => {
    e.preventDefault();
    if (!nuevoTenis.modelo || !nuevoTenis.costo || !nuevoTenis.precioVenta) return;
    setTenis([
      ...tenis,
      {
        id: Date.now(),
        modelo: nuevoTenis.modelo,
        talla: nuevoTenis.talla,
        costo: Number(nuevoTenis.costo),
        precioVenta: Number(nuevoTenis.precioVenta),
        vendido: false,
      },
    ]);
    setNuevoTenis({ modelo: "", talla: "", costo: "", precioVenta: "" });
  };

  const marcarVendido = (tenisId) => {
    setTenis(
      tenis.map((t) => (t.id === tenisId ? { ...t, vendido: !t.vendido } : t))
    );
  };

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
          <h1 className="font-display text-3xl text-text">Lote {id}</h1>
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
          <p className="font-display text-2xl mt-1 text-text">
            ${ventasTotal.toLocaleString()}
          </p>
        </div>
        <div className="border border-border rounded-sm bg-surface px-5 py-4">
          <p className="text-muted text-sm">Ganancia</p>
          <p className={`font-display text-2xl mt-1 ${ganancia >= 0 ? "text-positive" : "text-negative"}`}>
            ${ganancia.toLocaleString()}
          </p>
        </div>
        <div className="border border-border rounded-sm bg-surface px-5 py-4">
          <p className="text-muted text-sm">Recuperado</p>
          <p className="font-display text-2xl mt-1 text-text">{recuperado}%</p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-8">
        <section>
          <h2 className="font-display text-xl text-text mb-4">Gastos</h2>
          <div className="border border-border rounded-sm overflow-hidden mb-4">
            <table className="w-full text-sm">
              <tbody>
                {gastos.map((gasto) => (
                  <tr key={gasto.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-text">{gasto.concepto}</td>
                    <td className="px-4 py-3 text-right text-muted">
                      ${gasto.monto.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form onSubmit={agregarGasto} className="flex gap-2">
            <input
              type="text"
              placeholder="Concepto"
              value={nuevoGasto.concepto}
              onChange={(e) => setNuevoGasto({ ...nuevoGasto, concepto: e.target.value })}
              className="flex-1 bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
            />
            <input
              type="number"
              placeholder="Monto"
              value={nuevoGasto.monto}
              onChange={(e) => setNuevoGasto({ ...nuevoGasto, monto: e.target.value })}
              className="w-28 bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
            />
            <button
              type="submit"
              className="border border-accent text-accent px-4 rounded-sm text-sm hover:bg-accent hover:text-bg transition-colors"
            >
              Agregar
            </button>
          </form>
        </section>

        <section>
          <h2 className="font-display text-xl text-text mb-4">Tenis</h2>
          <div className="border border-border rounded-sm overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface text-muted text-left border-b border-border">
                  <th className="px-4 py-2 font-normal">Modelo</th>
                  <th className="px-4 py-2 font-normal text-right">Costo</th>
                  <th className="px-4 py-2 font-normal text-right">Venta</th>
                  <th className="px-4 py-2 font-normal text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {tenis.map((par) => (
                  <tr key={par.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-text">
                      {par.modelo}
                      <span className="text-muted"> / {par.talla}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      ${par.costo.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      ${par.precioVenta.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => marcarVendido(par.id)}
                        className={`text-xs px-2 py-1 rounded-sm border ${
                          par.vendido
                            ? "border-positive text-positive"
                            : "border-border text-muted"
                        }`}
                      >
                        {par.vendido ? "Vendido" : "Disponible"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form onSubmit={agregarTenis} className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Modelo"
              value={nuevoTenis.modelo}
              onChange={(e) => setNuevoTenis({ ...nuevoTenis, modelo: e.target.value })}
              className="bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
            />
            <input
              type="text"
              placeholder="Talla"
              value={nuevoTenis.talla}
              onChange={(e) => setNuevoTenis({ ...nuevoTenis, talla: e.target.value })}
              className="bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
            />
            <input
              type="number"
              placeholder="Costo"
              value={nuevoTenis.costo}
              onChange={(e) => setNuevoTenis({ ...nuevoTenis, costo: e.target.value })}
              className="bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
            />
            <input
              type="number"
              placeholder="Precio de venta"
              value={nuevoTenis.precioVenta}
              onChange={(e) => setNuevoTenis({ ...nuevoTenis, precioVenta: e.target.value })}
              className="bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
            />
            <button
              type="submit"
              className="col-span-2 border border-accent text-accent py-2 rounded-sm text-sm hover:bg-accent hover:text-bg transition-colors"
            >
              Agregar tenis
            </button>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default LoteDetalle;