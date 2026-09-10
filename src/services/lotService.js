import api from "./api";

export const getLotes = async () => {
  const response = await api.get("/lot");
  return response.data;
};
export const getLotePorId = async (id) => {
  const lotes = await getLotes();
  return lotes.find((lote) => lote._id === id);
};

export const crearLote = async (desglose) => {
  const response = await api.post("/lot", desglose);
  return response.data;
};

export const actualizarEstadoLote = async (id, estado) => {
  const response = await api.put(`/lot/${id}/state`, { estado });
  return response.data;
};

export const actualizarInversionLote = async (id, desglose) => {
  const response = await api.put(`/lot/${id}/inversion`, desglose);
  return response.data;
};

export const eliminarLote = async (id) => {
  const response = await api.put(`/lot/${id}/delete`);
  return response.data;
};