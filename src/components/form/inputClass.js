const inputClass = (hasError) =>
  `w-full bg-background border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-1 transition-colors ${
    hasError
      ? "border-negative focus:border-negative focus:ring-negative/30"
      : "border-border focus:border-accent focus:ring-accent/30"
  }`;

export default inputClass;
