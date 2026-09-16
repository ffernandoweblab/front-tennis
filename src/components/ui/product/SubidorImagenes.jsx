import { useState } from "react";
import { ImagePlus, X, Sparkles } from "lucide-react";
import Button from "../Button";

const MAX_IMAGENES = 6;

function SubidorImagenes({ imagenes, previews, onAgregar, onEliminar, error, onAutocompletar, analizando }) {
  const [arrastrando, setArrastrando] = useState(false);

  const handleInputChange = (e) => {
    onAgregar(e.target.files);
    e.target.value = null;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    if (imagenes.length >= MAX_IMAGENES) return;
    onAgregar(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={handleDrop}
        className={`rounded-sm border-2 border-dashed transition-colors ${arrastrando ? "border-accent bg-accent/5" : "border-border"
          }`}
      >
        {previews.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 p-2">
            {previews.map((src, i) => (
              <div key={i} className="relative group">
                <img
                  src={src}
                  alt=""
                  className="w-full aspect-square object-cover rounded-sm border border-border"
                />
                <button
                  type="button"
                  onClick={() => onEliminar(i)}
                  className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-negative focus:bg-negative focus:outline-none focus-visible:ring-2 focus-visible:ring-negative transition-colors"
                  aria-label={`Quitar imagen ${i + 1}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {imagenes.length < MAX_IMAGENES && (
              <label className="flex flex-col items-center justify-center gap-1 aspect-square rounded-sm border border-border cursor-pointer text-muted hover:border-accent hover:text-accent focus-within:ring-2 focus-within:ring-accent focus-within:border-accent transition-colors">
                <ImagePlus size={18} />
                <span className="text-xs">Agregar</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleInputChange}
                  className="sr-only"
                />
              </label>
            )}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 py-10 cursor-pointer text-muted hover:text-accent focus-within:ring-2 focus-within:ring-accent focus-within:border-accent transition-colors">
            <ImagePlus size={24} />
            <span className="text-sm">Arrastra imagenes o haz clic</span>
            <span className="text-xs">Hasta {MAX_IMAGENES} fotos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleInputChange}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {error && <p className="text-xs text-negative">{error}</p>}

      {onAutocompletar && (
        <Button
          type="button"
          variante="secundary"
          icono={Sparkles}
          onClick={onAutocompletar}
          disabled={analizando || imagenes.length === 0}
        >
          {analizando ? "Analizando imagenes..." : "Autocompletar con IA"}
        </Button>
      )}
    </div>
  );
}

export default SubidorImagenes;
export { MAX_IMAGENES };
