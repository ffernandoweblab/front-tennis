import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Inicio" },
  { to: "/lotes", label: "Lotes" },
  { to: "/inventario", label: "Inventario" },
  { to: "/categorias", label: "Categorias" },
  { to: "/ventas", label: "Ventas" },
  { to: "/reportes", label: "Reportes" },
];

function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-surface flex flex-col">
      <div className="px-6 py-6 border-b border-border">
        <span className="font-display text-2xl tracking-wide text-text">
          Punto de Venta
        </span>
      </div>
      <nav className="flex flex-col py-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `px-6 py-3 text-sm font-body border-l-2 ${
                isActive
                  ? "border-accent text-text bg-bg"
                  : "border-transparent text-muted hover:text-text hover:bg-bg"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;