function Seccion({ titulo, descripcion, children, className = "" }) {
  return (
    <section className={`border border-border rounded-sm bg-surface flex flex-col ${className}`}>
      <div className="px-5 py-3.5 border-b border-border">
        <h2 className="text-sm font-semibold text-text">{titulo}</h2>
        {descripcion && <p className="text-xs text-muted mt-0.5 leading-relaxed">{descripcion}</p>}
      </div>
      <div className="px-5 py-4 space-y-4 flex-1">{children}</div>
    </section>
  );
}

export default Seccion;
