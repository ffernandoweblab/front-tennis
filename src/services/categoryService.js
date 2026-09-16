import api from "./api";

export const getCategorias = async () => {
  const response = await api.get("/category");
  return response.data;
};

export const getCategoriaPorId = async (id) => {
  const response = await api.get(`/category/${id}`);
  return response.data;
};

export const crearCategoria = async (categoria) => {
  const response = await api.post("/category", categoria);
  return response.data;
};

export const actualizarCategoria = async (id, datos) => {
  const response = await api.put(`/category/${id}`, datos);
  return response.data;
};

export const eliminarCategoria = async (id) => {
  const response = await api.delete(`/category/${id}`);
  return response.data;
};
