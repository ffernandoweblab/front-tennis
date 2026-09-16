function TarjetaStat({ titulo, valor, className = "text-text" }) {
  return (
    <div className="border border-border rounded-sm bg-surface px-5 py-4">
      <p className="text-muted text-sm">{titulo}</p>
      <p className={`font-display text-2xl mt-1 ${className}`}>{valor}</p>
    </div>
  );
}

export default TarjetaStat;
