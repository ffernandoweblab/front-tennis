import DashboardLayout from "../layouts/DashboardLayout";

const stats = [
  { label: "Inversion", value: "$45,000" },
  { label: "Ventas", value: "$58,700" },
  { label: "Ganancia", value: "$13,700" },
  { label: "Stock", value: "32 pares" },
];

const lotes = [
  { nombre: "Lote 1", avance: 90 },
  { nombre: "Lote 2", avance: 72 },
  { nombre: "Lote 3", avance: 40 },
];

function Dashboard() {
  return (
    <DashboardLayout>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-text">Resumen del negocio</h1>
        <p className="text-muted mt-1">Estado actual de tus lotes y ventas.</p>
      </header>

      <section className="grid grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border border-border rounded-sm bg-surface px-5 py-4"
          >
            <p className="text-muted text-sm">{stat.label}</p>
            <p className="font-display text-2xl mt-1 text-text">{stat.value}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-display text-xl text-text mb-4">Rendimiento de lotes</h2>
        <div className="space-y-4">
          {lotes.map((lote) => (
            <div key={lote.nombre}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text">{lote.nombre}</span>
                <span className="text-muted">{lote.avance}%</span>
              </div>
              <div className="h-2 bg-surface border border-border rounded-sm overflow-hidden">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${lote.avance}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}

export default Dashboard;