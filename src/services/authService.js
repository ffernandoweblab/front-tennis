import api from "./api";

export const login = async (usuario, password) => {
  const response = await api.post("/auth/login", { usuario, password });
  return response.data;
};