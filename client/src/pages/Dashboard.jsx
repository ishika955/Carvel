import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getMe, updateProfilePic } from "../services/api";

function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [preview, setPreview] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token") || localStorage.getItem("token");
    const role = searchParams.get("role") || localStorage.getItem("role");
    const username = searchParams.get("username") || localStorage.getItem("username");

    if (!token) { navigate("/login"); return; }

    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("username", username);

    // Fetch full user data
    getMe().then(setUser).catch(() => navigate("/login"));
  }, []);

  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUpdating(true);
    setMsg("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await updateProfilePic(formData);
      // Update user profilePic in state
      setUser(prev => ({ ...prev, profilePic: res.imageUrl }));
      setMsg("✅ Profile picture updated!");
    } catch {
      setMsg("❌ Failed to update picture");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (!user) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.avatarSection}>
          <div style={styles.avatarWrapper}>
            <img
              src={preview || user.profilePic || `https://ui-avatars.com/api/?name=${user.username}&background=4f8ef7&color=fff&size=128`}
              alt="Profile"
              style={styles.avatar}
            />
            <label style={styles.editBadge} title="Update photo">
              ✏️
              <input type="file" accept="image/*" onChange={handlePicChange} style={{ display: "none" }} />
            </label>
          </div>
          <p style={styles.username}>{user.username}</p>
          <p style={styles.role}>{user.role}</p>
          {msg && <p style={styles.msg}>{msg}</p>}
          {updating && <p style={styles.msg}>Uploading...</p>}
        </div>

        <nav style={styles.nav}>
          <a style={styles.navItem} href="#">🏠 Home</a>
          <a style={styles.navItem} href="#">👴 Patients</a>
          <a style={styles.navItem} href="#">🔔 Alerts</a>
          <a style={styles.navItem} href="#">⚙️ Settings</a>
        </nav>

        <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        <h1 style={styles.welcome}>Welcome back, {user.username} 👋</h1>
        <div style={styles.cards}>
          <div style={styles.card}><h3>👴 Patients</h3><p>{user.patients?.length || 0} assigned</p></div>
          <div style={styles.card}><h3>🔔 Alerts</h3><p>Check active alerts</p></div>
          <div style={styles.card}><h3>📧 Notify Email</h3><p>{user.notifyEmail || "Not set"}</p></div>
          <div style={styles.card}><h3>📱 Notify Phone</h3><p>{user.notifyPhone || "Not set"}</p></div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: 20 },
  container: { display: "flex", minHeight: "100vh", background: "#f0f4ff" },
  sidebar: { width: 240, background: "#1a1a2e", color: "#fff", display: "flex", flexDirection: "column", padding: 24, gap: 12 },
  avatarSection: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 },
  avatarWrapper: { position: "relative", marginBottom: 8 },
  avatar: { width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: "3px solid #4f8ef7" },
  editBadge: { position: "absolute", bottom: 0, right: 0, background: "#4f8ef7", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 },
  username: { fontWeight: 700, fontSize: 16, margin: 0 },
  role: { fontSize: 12, color: "#aaa", margin: 0 },
  msg: { fontSize: 12, color: "#7ef7a0", marginTop: 4, textAlign: "center" },
  nav: { display: "flex", flexDirection: "column", gap: 8, flex: 1 },
  navItem: { color: "#ccc", textDecoration: "none", padding: "10px 12px", borderRadius: 8, fontSize: 14, background: "rgba(255,255,255,0.05)" },
  logoutBtn: { background: "#e74c3c", color: "#fff", border: "none", borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 14 },
  main: { flex: 1, padding: 36 },
  welcome: { color: "#1a1a2e", marginBottom: 24 },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 },
  card: { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }
};

export default Dashboard;