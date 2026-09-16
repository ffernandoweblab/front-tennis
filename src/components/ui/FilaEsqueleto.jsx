function FilaEsqueleto({ columnas = 8 }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-5 py-4" colSpan={columnas}>
        <div className="h-4 bg-border/50 rounded-sm animate-pulse" />
      </td>
    </tr>
  );
}

export default FilaEsqueleto;
