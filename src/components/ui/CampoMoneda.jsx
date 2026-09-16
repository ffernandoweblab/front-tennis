import Campo from "../form/Campo";
import inputClass from "../form/inputClass";

function CampoMoneda({ label, required, error, hint, value, onChange, onBlur, min = "0" }) {
  return (
    <Campo label={label} required={required} error={error} hint={hint}>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
        <input
          type="number"
          min={min}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`${inputClass(!!error)} pl-6`}
        />
      </div>
    </Campo>
  );
}

export default CampoMoneda;
