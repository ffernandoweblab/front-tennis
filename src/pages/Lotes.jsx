import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";

const lotesMock = [
  { id: 1, nombre: "Lote 1", inversion: 18000, ventas: 22400, recuperado: 90 },
  { id: 2, nombre: "Lote 2", inversion: 15000, ventas: 12800, recuperado: 72 },
  { id: 3, nombre: "Lote 3", inversion: 12000, ventas: 5100, recuperado: 40 },
];

function Lotes() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-text">Lotes</h1>
          <p className="text-muted mt-1">Control de inversion y recuperacion por lote.</p>
        </div>
        <button
          onClick={() => navigate("/lotes/nuevo")}
          className="border border-accent text-accent px-4 py-2 rounded-sm text-sm hover:bg-accent hover:text-bg transition-colors"
        >
          Nuevo lote
        </button>
      </header>

      <div className="border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-muted text-left border-b border-border">
              <th className="px-5 py-3 font-normal">Lote</th>
              <th className="px-5 py-3 font-normal text-right">Inversion</th>
              <th className="px-5 py-3 font-normal text-right">Ventas</th>
              <th className="px-5 py-3 font-normal text-right">Recuperado</th>
            </tr>
          </thead>
          <tbody>
            {lotesMock.map((lote) => (
              <tr
                key={lote.id}
                onClick={() => navigate(`/lotes/${lote.id}`)}
                className="border-b border-border last:border-0 cursor-pointer hover:bg-surface"
              >
                <td className="px-5 py-4 text-text">{lote.nombre}</td>
                <td className="px-5 py-4 text-right text-muted">
                  ${lote.inversion.toLocaleString()}
                </td>
                <td className="px-5 py-4 text-right text-muted">
                  ${lote.ventas.toLocaleString()}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <div className="w-24 h-2 bg-bg border border-border rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${lote.recuperado}%` }}
                      />
                    </div>
                    <span className="text-text w-10 text-right">{lote.recuperado}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

export default Lotes;