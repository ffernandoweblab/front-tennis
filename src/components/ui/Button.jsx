const variantes = {
  primary: "bg-accent text-white hover:opacity-90 transition-opacity",
  ghost: "text-muted border border-border hover:bg-surface transition-colors",
  danger: "bg-negative text-white hover:opacity-90 disabled:opacity-50 transition-opacity",
  secundary: "w-full flex items-center justify-center gap-1.5 text-xs font-medium border border-accent text-accent px-3 py-2 rounded-sm disabled:opacity-40 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
};

function Button({ children, variante = "ghost", icono: Icono, className = "", ...props }) {
  return (
    <button
      className={`flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-sm ${variantes[variante]} ${className}`}
      {...props}
    >
      {Icono && <Icono size={14} />}
      {children}
    </button>
  );
}

export default Button;