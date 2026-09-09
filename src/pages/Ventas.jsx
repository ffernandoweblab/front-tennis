import { useState, useMemo } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

const disponiblesMock = [
  { id: 1, modelo: "Jordan 1 Retro High", talla: "8.5", precioVenta: 2800 },
  { id: 2, modelo: "Yeezy 350 V2", talla: "9", precioVenta: 3900 },
  { id: 3, modelo: "New Balance 550", talla: "8", precioVenta: 2000 },
];

const ventasIniciales = [
  {
    id: 1,
    modelo: "Jordan 4 Retro",
    cliente: "Marco Reyes",
    total: 3400,
    tipoPago: "Contado",
    abonado: 3400,
    fecha: "2026-08-20",
  },
  {
    id: 2,
    modelo: "Dunk Low Panda",
    cliente: "Ana Torres",
    total: 2300,
    tipoPago: "Abono",
    abonado: 1200,
    fecha: "2026-08-25",
  },
];

function Ventas() {
  const [ventas, setVentas] = useState(ventasIniciales);
  const [form, setForm] = useState({
    productoId: "",
    cliente: "",
    tipoPago: "Contado",
    montoInicial: "",
  });

  const producto = disponiblesMock.find((p) => p.id === Number(form.productoId));

  const totalVentas = useMemo(
    () => ventas.reduce((acc, v) => acc + v.abonado, 0),
    [ventas]
  );

  const pendienteCobro = useMemo(
    () => ventas.reduce((acc, v) => acc + (v.total - v.abonado), 0),
    [ventas]
  );

  const registrarVenta = (e) => {
    e.preventDefault();
    if (!producto || !form.cliente) return;

    const abonado =
      form.tipoPago === "Contado"
        ? producto.precioVenta
        : Number(form.montoInicial || 0);

    setVentas([
      ...ventas,
      {
        id: Date.now(),
        modelo: producto.modelo,
        cliente: form.cliente,
        total: producto.precioVenta,
        tipoPago: form.tipoPago,
        abonado,
        fecha: new Date().toISOString().slice(0, 10),
      },
    ]);

    setForm({ productoId: "", cliente: "", tipoPago: "Contado", montoInicial: "" });
  };

  const registrarAbono = (ventaId, monto) => {
    if (!monto) return;
    setVentas(
      ventas.map((v) =>
        v.id === ventaId
          ? { ...v, abonado: Math.min(v.total, v.abonado + Number(monto)) }
          : v
      )
    );
  };

  return (
    <DashboardLayout>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-text">Ventas</h1>
        <p className="text-muted mt-1">Registro de ventas y seguimiento de abonos.</p>
      </header>

      <section className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-border rounded-sm bg-surface px-5 py-4">
          <p className="text-muted text-sm">Cobrado</p>
          <p className="font-display text-2xl mt-1 text-positive">
            ${totalVentas.toLocaleString()}
          </p>
        </div>
        <div className="border border-border rounded-sm bg-surface px-5 py-4">
          <p className="text-muted text-sm">Pendiente por cobrar</p>
          <p className="font-display text-2xl mt-1 text-accent">
            ${pendienteCobro.toLocaleString()}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-8">
        <section className="col-span-2">
          <h2 className="font-display text-xl text-text mb-4">Historial</h2>
          <div className="border border-border rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface text-muted text-left border-b border-border">
                  <th className="px-4 py-3 font-normal">Producto</th>
                  <th className="px-4 py-3 font-normal">Cliente</th>
                  <th className="px-4 py-3 font-normal text-right">Total</th>
                  <th className="px-4 py-3 font-normal text-right">Abonado</th>
                  <th className="px-4 py-3 font-normal text-right">Pago</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => {
                  const liquidado = venta.abonado >= venta.total;
                  return (
                    <tr key={venta.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-text">
                        {venta.modelo}
                        <div className="text-muted text-xs">{venta.fecha}</div>
                      </td>
                      <td className="px-4 py-3 text-muted">{venta.cliente}</td>
                      <td className="px-4 py-3 text-right text-muted">
                        ${venta.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-text">
                        ${venta.abonado.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {liquidado ? (
                          <span className="text-xs px-2 py-1 rounded-sm border border-positive text-positive">
                            Liquidado
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              const monto = prompt("Monto del abono");
                              registrarAbono(venta.id, monto);
                            }}
                            className="text-xs px-2 py-1 rounded-sm border border-accent text-accent hover:bg-accent hover:text-bg transition-colors"
                          >
                            Registrar abono
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl text-text mb-4">Nueva venta</h2>
          <form onSubmit={registrarVenta} className="border border-border rounded-sm bg-surface p-5 space-y-3">
            <select
              value={form.productoId}
              onChange={(e) => setForm({ ...form, productoId: e.target.value })}
              className="w-full bg-bg border border-border rounded-sm px-3 py-2 text-sm text-text"
            >
              <option value="">Selecciona un par</option>
              {disponiblesMock.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.modelo} / {p.talla} - ${p.precioVenta.toLocaleString()}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Nombre del cliente"
              value={form.cliente}
              onChange={(e) => setForm({ ...form, cliente: e.target.value })}
              className="w-full bg-bg border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, tipoPago: "Contado" })}
                className={`flex-1 py-2 rounded-sm text-sm border ${
                  form.tipoPago === "Contado"
                    ? "border-accent text-accent"
                    : "border-border text-muted"
                }`}
              >
                Contado
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, tipoPago: "Abono" })}
                className={`flex-1 py-2 rounded-sm text-sm border ${
                  form.tipoPago === "Abono"
                    ? "border-accent text-accent"
                    : "border-border text-muted"
                }`}
              >
                Abono
              </button>
            </div>

            {form.tipoPago === "Abono" && (
              <input
                type="number"
                placeholder="Monto inicial"
                value={form.montoInicial}
                onChange={(e) => setForm({ ...form, montoInicial: e.target.value })}
                className="w-full bg-bg border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
              />
            )}

            <button
              type="submit"
              className="w-full bg-accent text-bg py-2 rounded-sm text-sm font-medium"
            >
              Registrar venta
            </button>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default Ventas;