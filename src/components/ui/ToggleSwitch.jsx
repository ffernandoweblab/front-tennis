function ToggleSwitch({ checked, onChange, labelOn = "Activo", labelOff = "Inactivo" }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-sm border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        checked
          ? "border-positive/40 bg-positive/5 text-positive"
          : "border-border text-muted hover:border-accent/40"
      }`}
    >
      <span
        className={`relative rounded-full transition-colors ${checked ? "bg-positive" : "bg-border"}`}
        style={{ width: "32px", height: "18px" }}
      >
        <span
          className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-0" : "-translate-x-3"
          }`}
        />
      </span>
      {checked ? labelOn : labelOff}
    </button>
  );
}

export default ToggleSwitch;
