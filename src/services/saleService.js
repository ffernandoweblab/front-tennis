import api from "./api";

export const getVentas = async () => {
  try {
    const response = await api.get("/ventas");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    return [];
  }
};

export const crearVenta = async (ventaData) => {
  const response = await api.post("/ventas", ventaData);
  return response.data;
};

export const actualizarVenta = async (id, abono) => {
  const response = await api.put(`/ventas/${id}`, { id, abono });
  return response.data;
};

export const registrarAbono = async (id, abonoData) => {
  const response = await api.put(`/ventas/${id}`, { id, abono: abonoData });
  return response.data;
};
