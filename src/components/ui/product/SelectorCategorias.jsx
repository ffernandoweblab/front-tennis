import { Check } from "lucide-react";
import Campo from "../../form/Campo";

function SelectorCategorias({ categorias, seleccionada, onSeleccionar, error }) {
  const handleKeyDown = (e, index) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const siguiente = (index + 1) % categorias.length;
      document.getElementById(`categoria-btn-${categorias[siguiente]._id}`)?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const anterior = (index - 1 + categorias.length) % categorias.length;
      document.getElementById(`categoria-btn-${categorias[anterior]._id}`)?.focus();
    }
  };

  return (
    <Campo
      label="Categoria"
      required
      error={error}
    >
      <div
        className="flex gap-1.5 flex-wrap"
        role="group"
        aria-label="Seleccionar categoria"
      >
        {categorias.map((c, idx) => {
          const activa = seleccionada === c._id;
          return (
            <button
              type="button"
              id={`categoria-btn-${c._id}`}
              key={c._id}
              onClick={() => onSeleccionar(c._id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              aria-pressed={activa}
              className={`flex items-center gap-1 text-xs px-3 py-2.5 rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                activa
                  ? "bg-accent text-white border-accent"
                  : "border-border text-muted hover:border-accent/50 hover:text-text"
              }`}
            >
              {activa && <Check size={11} />}
              {c.nombre}
            </button>
          );
        })}
      </div>
    </Campo>
  );
}

export default SelectorCategorias;
