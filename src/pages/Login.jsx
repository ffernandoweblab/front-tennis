import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {

  const navigate = useNavigate();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {

    e.preventDefault();

    if (usuario === "admin" && password === "123456") {
      navigate("/dashboard");
    } else {
      alert("Usuario o contraseña incorrectos");
    }

  };

  return (
    <div>

      <h1>Punto de Venta</h1>

      <form onSubmit={handleLogin}>

        <input
          type="text"
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">
          Iniciar sesión
        </button>

      </form>

    </div>
  );
}

export default Login;