import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

function Dashboard() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token    = searchParams.get("token")    || localStorage.getItem("token");
    const role     = searchParams.get("role")     || localStorage.getItem("role");
    const username = searchParams.get("username") || localStorage.getItem("username");

    if (!token) {
      window.location.href = "http://localhost:3000/login.html";
      return;
    }

    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("username", username);
    }

    window.location.href = `http://localhost:3000/dashboard.html?token=${token}&role=${role}&username=${encodeURIComponent(username)}`;
  }, []);

  return null;
}

export default Dashboard;