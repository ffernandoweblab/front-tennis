import api from "./api";

export const getProductos = async () => {
  const response = await api.get("/products");
  return response.data;
};

export const getProducto = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const getProductosPorLote = async (loteId) => {
  const productos = await getProductos();
  return productos.filter((producto) => producto.lote === loteId || producto.lote?._id === loteId);
};

export const crearProducto = async (formData) => {
  const response = await api.post("/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const rellenarDatosPorImagen = async (formData) => {
  const response = await api.post("/products/rellenarDatosImagen", formData);
  return response.data;
};

export const actualizarProducto = async (id, cambios) => {
  const response = await api.put(`/products/${id}`, cambios);
  return response.data;
};

export const eliminarProducto = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};


