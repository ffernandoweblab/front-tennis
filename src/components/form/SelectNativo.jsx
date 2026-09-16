import inputClass from "../form/inputClass";

function SelectNativo({ value, onChange, onBlur, options, error, placeholder = "Selecciona", getLabel = (o) => o.label, getValue = (o) => o.value }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={inputClass(error)}
    >
      <option value="" className="bg-surface text-text">
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={getValue(o)} value={getValue(o)} className="bg-surface text-text">
          {getLabel(o)}
        </option>
      ))}
    </select>
  );
}

export default SelectNativo;