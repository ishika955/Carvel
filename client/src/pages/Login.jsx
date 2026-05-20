import { useEffect } from "react";

function Login() {
  useEffect(() => {
    window.location.href = "https://carvel.onrender.com/login.html";
  }, []);
  return null;
}

export default Login;