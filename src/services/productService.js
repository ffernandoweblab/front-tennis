import api from "./api";

export const getProductos = async () => {
  const response = await api.get("/products");
  return response.data;
};

export const crearProducto = async (producto) => {
  const response = await api.post("/products", producto);
  return response.data;
};

export const actualizarProducto = async (id, cambios) => {
  const response = await api.put(`/products/${id}`, cambios);
  return response.data;
};