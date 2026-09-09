import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { getProductos } from "../services/productService";

const estadoColor = {
  Disponible: "text-positive border-positive",
  Vendido: "text-muted border-border",
  Apartado: "text-accent border-accent",
};

function Inventario() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargando(true);
        const data = await getProductos();
        setProductos(data);
        console.log("Productos cargados:", data);
        setError(null);
      } catch {
        setError("No se pudo cargar el inventario.");
      } finally {
        setCargando(false);
      }
    };

    cargarProductos();
  }, []);

  const filtrado = useMemo(() => {
    return productos.filter((item) => {
      const coincideBusqueda = item.modelo
        ?.toLowerCase()
        .includes(busqueda.toLowerCase());
      const coincideEstado = filtroEstado === "Todos" || item.estado === filtroEstado;
      return coincideBusqueda && coincideEstado;
    });
  }, [productos, busqueda, filtroEstado]);

  const disponibles = productos.filter((i) => i.estado === "Disponible").length;
  const valorInventario = productos
    .filter((i) => i.estado !== "Vendido")
    .reduce((acc, i) => acc + Number(i.costo || 0), 0);

  if (cargando) {
    return (
      <DashboardLayout>
        <p className="text-muted">Cargando inventario...</p>
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
      <header className="mb-8">
        <h1 className="font-display text-3xl text-text">Inventario</h1>
        <p className="text-muted mt-1">Pares disponibles agrupados por lote.</p>
      </header>

      <section className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-border rounded-sm bg-surface px-5 py-4">
          <p className="text-muted text-sm">Total de pares</p>
          <p className="font-display text-2xl mt-1 text-text">{productos.length}</p>
        </div>
        <div className="border border-border rounded-sm bg-surface px-5 py-4">
          <p className="text-muted text-sm">Disponibles</p>
          <p className="font-display text-2xl mt-1 text-text">{productos.length}</p>
        </div>
        <div className="border border-border rounded-sm bg-surface px-5 py-4">
          <p className="text-muted text-sm">Valor en inventario</p>
          <p className="font-display text-2xl mt-1 text-text">
            ${valorInventario.toLocaleString()}
          </p>
        </div>
      </section>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar modelo"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text placeholder-muted"
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text"
        >
          <option>Todos</option>
          <option>Disponible</option>
          <option>Apartado</option>
          <option>Vendido</option>
        </select>
      </div>

      <div className="border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-muted text-left border-b border-border">
              <th className="px-5 py-3 font-normal">Modelo</th>
              <th className="px-5 py-3 font-normal">Talla</th>
              <th className="px-5 py-3 font-normal">Lote</th>
              <th className="px-5 py-3 font-normal text-right">Costo</th>
              <th className="px-5 py-3 font-normal text-right">Venta</th>
              <th className="px-5 py-3 font-normal text-right">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtrado.map((item) => (
              <tr key={item._id} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="px-5 py-4 text-text">{item.modelo}</td>
                <td className="px-5 py-4 text-muted">{item.talla}</td>
                <td className="px-5 py-4 text-muted">{item.lote}</td>
                <td className="px-5 py-4 text-right text-muted">
                  ${Number(item.costo || 0).toLocaleString()}
                </td>
                <td className="px-5 py-4 text-right text-text">
                  ${Number(item.precioVenta || 0).toLocaleString()}
                </td>
                <td className="px-5 py-4 text-right">
                  <span
                    className={`text-xs px-2 py-1 rounded-sm border ${estadoColor[item.estado] || "text-muted border-border"}`}
                  >
                    {item.estado}
                  </span>
                </td>
              </tr>
            ))}
            {filtrado.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted">
                  No se encontraron pares con ese criterio.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

export default Inventario;