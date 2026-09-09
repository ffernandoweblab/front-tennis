import DashboardLayout from "../layouts/DashboardLayout";

const rendimientoLotes = [
  { nombre: "Lote 1", inversion: 18000, ventas: 22400 },
  { nombre: "Lote 2", inversion: 15000, ventas: 12800 },
  { nombre: "Lote 3", inversion: 12000, ventas: 5100 },
];

const topModelos = [
  { modelo: "Jordan 1 Retro High", vendidos: 6, ingreso: 16800 },
  { modelo: "Dunk Low Panda", vendidos: 4, ingreso: 9200 },
  { modelo: "Yeezy 350 V2", vendidos: 3, ingreso: 11700 },
];

function Reportes() {
  const inversionTotal = rendimientoLotes.reduce((acc, l) => acc + l.inversion, 0);
  const ventasTotal = rendimientoLotes.reduce((acc, l) => acc + l.ventas, 0);
  const gananciaTotal = ventasTotal - inversionTotal;

  return (
    <DashboardLayout>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-text">Reportes</h1>
        <p className="text-muted mt-1">Rendimiento general del negocio.</p>
      </header>

      <section className="grid grid-cols-3 gap-4 mb-10">
        <div className="border border-border rounded-sm bg-surface px-5 py-4">
          <p className="text-muted text-sm">Inversion total</p>
          <p className="font-display text-2xl mt-1 text-text">
            ${inversionTotal.toLocaleString()}
          </p>
        </div>
        <div className="border border-border rounded-sm bg-surface px-5 py-4">
          <p className="text-muted text-sm">Ventas totales</p>
          <p className="font-display text-2xl mt-1 text-text">
            ${ventasTotal.toLocaleString()}
          </p>
        </div>
        <div className="border border-border rounded-sm bg-surface px-5 py-4">
          <p className="text-muted text-sm">Ganancia neta</p>
          <p className={`font-display text-2xl mt-1 ${gananciaTotal >= 0 ? "text-positive" : "text-negative"}`}>
            ${gananciaTotal.toLocaleString()}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-8">
        <section>
          <h2 className="font-display text-xl text-text mb-4">Inversion vs ventas por lote</h2>
          <div className="space-y-5">
            {rendimientoLotes.map((lote) => {
              const maximo = Math.max(lote.inversion, lote.ventas);
              return (
                <div key={lote.nombre}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text">{lote.nombre}</span>
                    <span className="text-muted">
                      ${lote.ventas.toLocaleString()} / ${lote.inversion.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-bg border border-border rounded-sm overflow-hidden mb-1">
                    <div
                      className="h-full bg-border"
                      style={{ width: `${(lote.inversion / maximo) * 100}%` }}
                    />
                  </div>
                  <div className="h-2 bg-bg border border-border rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${(lote.ventas / maximo) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl text-text mb-4">Modelos mas vendidos</h2>
          <div className="border border-border rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface text-muted text-left border-b border-border">
                  <th className="px-4 py-3 font-normal">Modelo</th>
                  <th className="px-4 py-3 font-normal text-right">Vendidos</th>
                  <th className="px-4 py-3 font-normal text-right">Ingreso</th>
                </tr>
              </thead>
              <tbody>
                {topModelos.map((item) => (
                  <tr key={item.modelo} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-text">{item.modelo}</td>
                    <td className="px-4 py-3 text-right text-muted">{item.vendidos}</td>
                    <td className="px-4 py-3 text-right text-text">
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