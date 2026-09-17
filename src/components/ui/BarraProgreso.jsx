function BarraProgreso({ porcentaje, texto }) {
  const valor = Math.min(Math.max(Number(porcentaje) || 0, 0), 100);
  const porcentajeLegible = Number.isInteger(valor) ? valor : valor.toFixed(1).replace(/\.0$/, "");

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${valor}%` }}
        />
      </div>
      <span className="text-xs text-muted tabular-nums">
        {texto !== undefined ? texto : `${porcentajeLegible}% completo`}
      </span>
    </div>
  );
}

export default BarraProgreso;
