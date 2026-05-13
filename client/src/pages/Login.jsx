import { useEffect } from "react";

function Login() {
  useEffect(() => {
    window.location.href = "http://localhost:3000/login.html";
  }, []);
  return null;
}

export default Login;