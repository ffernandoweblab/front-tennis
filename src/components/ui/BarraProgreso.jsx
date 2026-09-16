function BarraProgreso({ porcentaje }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <span className="text-xs text-muted tabular-nums">{porcentaje}% completo</span>
    </div>
  );
}

export default BarraProgreso;
