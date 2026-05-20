import { useEffect } from "react";

function Login() {
  useEffect(() => {
   window.location.href = "https://carvel.vercel.app/login.html"
  }, []);
  return null;
}

export default Login;