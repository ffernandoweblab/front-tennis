import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Lotes from "./pages/Lotes";
import LoteDetalle from "./pages/LoteDetalle";
import Inventario from "./pages/Inventario";
import Ventas from "./pages/Ventas";
import Reportes from "./pages/Reportes";
import NuevoProducto from "./pages/NuevoProducto";
import EditarProducto from "./pages/EditarProducto";
import Categorias from "./pages/Categorias";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lotes" element={<Lotes />} />
        <Route path="/lotes/:id" element={<LoteDetalle />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/inventario/newProduct" element={<NuevoProducto />} />
        <Route path="/inventario/editar/:id" element={<EditarProducto />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;