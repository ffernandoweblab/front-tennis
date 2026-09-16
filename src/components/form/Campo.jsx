function Campo({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1.5">
        {label}
        {required && <span className="text-negative ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-negative mt-1.5">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}

export default Campo;
