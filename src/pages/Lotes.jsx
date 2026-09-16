import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { getLotes, crearLote } from "../services/lotService";


function calcularInversion(desglose) {
  if (!desglose) return 0;
  const { mercancia = 0, viaticos = 0, gasolina = 0, otros = 0 } = desglose;
  return Number(mercancia) + Number(viaticos) + Number(gasolina) + Number(otros);
}

function Lotes() {
  const navigate = useNavigate();

  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const [form, setForm] = useState({
    mercancia: "",
    viaticos: "",
    gasolina: "",
    otros: "",
  });

  const cargarLotes = async () => {
    try {
      setCargando(true);
      const data = await getLotes();
      setLotes(data);
      console.log("Lotes cargados:", data);
      setError(null);
    } catch {
      setError("No se pudieron cargar los lotes.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarLotes();
  }, []);

  const totalInvertido = useMemo(
    () => lotes.reduce((acc, lote) => acc + calcularInversion(lote.desgloseInversion), 0),
    [lotes]
  );

  const crear = async (e) => {
    e.preventDefault();

    const mercancia = Number(form.mercancia);
    const viaticos = Number(form.viaticos);
    const gasolina = Number(form.gasolina);
    const otros = Number(form.otros);

    if (!mercancia || mercancia < 1) {
      alert("El campo mercancia es obligatorio y debe ser mayor a 0.");
      return;
    }
    if (!viaticos || viaticos < 1) {
      alert("El campo viaticos es obligatorio y debe ser mayor a 0.");
      return;
    }
    if (!gasolina || gasolina < 1) {
      alert("El campo gasolina es obligatorio y debe ser mayor a 0.");
      return;
    }
    if (!otros || otros < 1) {
      alert("El campo otros es obligatorio y debe ser mayor a 0.");
      return;
    }

    try {
      await crearLote({ mercancia, viaticos, gasolina, otros });
      setForm({ mercancia: "", viaticos: "", gasolina: "", otros: "" });
      setMostrarForm(false);
      cargarLotes();
    } catch {
      alert("No se pudo crear el lote.");
    }
  };

  if (cargando) {
    return (
      <DashboardLayout>
        <p className="text-muted">Cargando lotes...</p>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <p className="text-negative">{error}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-text">Lotes</h1>
          <p className="text-muted mt-1">Control de inversion por lote.</p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="border border-accent text-accent px-4 py-2 rounded-sm text-sm hover:bg-accent hover:text-bg transition-colors"
        >
          {mostrarForm ? "Cancelar" : "Nuevo lote"}
        </button>
      </header>

      {mostrarForm && (
        <form
          onSubmit={crear}
          className="border border-border rounded-sm bg-surface p-5 grid grid-cols-4 gap-3 mb-8"
        >
          <input
            type="number"
            placeholder="Mercancia"
            value={form.mercancia}
            onChange={(e) => setForm({ ...form, mercancia: e.target.value })}
            className="bg-bg border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
          />
          <input
            type="number"
            placeholder="Viaticos"
            value={form.viaticos}
            onChange={(e) => setForm({ ...form, viaticos: e.target.value })}
            className="bg-bg border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
          />
          <input
            type="number"
            placeholder="Gasolina"
            value={form.gasolina}
            onChange={(e) => setForm({ ...form, gasolina: e.target.value })}
            className="bg-bg border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
          />
          <input
            type="number"
            placeholder="Otros"
            value={form.otros}
            onChange={(e) => setForm({ ...form, otros: e.target.value })}
            className="bg-bg border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
          />
          <button
            type="submit"
            className="col-span-4 bg-accent text-bg py-2 rounded-sm text-sm font-medium"
          >
            Guardar lote
          </button>
        </form>
      )}

      <section className="mb-8">
        <div className="border border-border rounded-sm bg-surface px-5 py-4 inline-block">
          <p className="text-muted text-sm">Inversion total en lotes activos</p>
          <p className="font-display text-2xl mt-1 text-text">
            ${totalInvertido.toLocaleString()}
          </p>
        </div>
      </section>

      <div className="border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-muted text-left border-b border-border">
              <th className="px-5 py-3 font-normal">Lote</th>
              <th className="px-5 py-3 font-normal text-right">Inversion</th>
              <th className="px-5 py-3 font-normal text-right">Estado</th>
            </tr>
          </thead>
          <tbody>
            {lotes.map((lote) => (
              <tr
                key={lote._id}
                onClick={() => navigate(`/lotes/${lote._id}`)}
                className="border-b border-border last:border-0 cursor-pointer hover:bg-surface"
              >
                <td className="px-5 py-4 text-text">{lote.numLot}</td>
                <td className="px-5 py-4 text-right text-muted">
                  ${calcularInversion(lote.desgloseInversion).toLocaleString()}
                </td>
                <td className="px-5 py-4 text-right">
                  <span
                    className={`text-xs px-2 py-1 rounded-sm border ${lote.estado === "activo"
                      ? "text-positive border-positive"
                      : "text-muted border-border"
                      }`}
                  >
                    {lote.estado}
                  </span>
                </td>
              </tr>
            ))}
            {lotes.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-muted">
                  Aun no hay lotes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

export default Lotes;