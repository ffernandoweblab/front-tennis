import api from "./api";

export const getCategorias = async () => {
  const response = await api.get("/category");
  return response.data;
};

export const crearCategoria = async (categoria) => {
  const response = await api.post("/category", categoria);
  return response.data;
};


