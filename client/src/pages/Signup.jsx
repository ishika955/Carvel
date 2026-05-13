import { useEffect } from "react";

function Signup() {
  useEffect(() => {
    window.location.href = "http://localhost:3000/signup.html";
  }, []);
  return null;
}

export default Signup;