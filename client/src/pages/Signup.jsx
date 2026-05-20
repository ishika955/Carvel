import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "", password: "", role: "caretaker",
    notifyEmail: "", notifyPhone: ""
  });
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfilePic(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (profilePic) formData.append("profilePic", profilePic);

      await registerUser(formData);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>

        {/* Profile Pic Preview */}
        <div style={styles.avatarWrapper}>
          <img
            src={preview || "https://ui-avatars.com/api/?name=User&background=4f8ef7&color=fff&size=128"}
            alt="Profile Preview"
            style={styles.avatar}
          />
          <label style={styles.uploadBtn}>
            📷 Choose Photo
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
          </label>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input style={styles.input} name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
          <input style={styles.input} name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          <select style={styles.input} name="role" value={form.role} onChange={handleChange}>
            <option value="caretaker">Caretaker</option>
            <option value="admin">Admin</option>
            <option value="family">Family</option>
          </select>
          <input style={styles.input} name="notifyEmail" placeholder="Notification Email (optional)" value={form.notifyEmail} onChange={handleChange} />
          <input style={styles.input} name="notifyPhone" placeholder="Notification Phone (optional)" value={form.notifyPhone} onChange={handleChange} />

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p style={styles.link}>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff" },
  card: { background: "#fff", borderRadius: 16, padding: 36, width: 380, boxShadow: "0 4px 24px rgba(0,0,0,0.10)" },
  title: { textAlign: "center", marginBottom: 20, color: "#1a1a2e" },
  avatarWrapper: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20, gap: 10 },
  avatar: { width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "3px solid #4f8ef7" },
  uploadBtn: { background: "#4f8ef7", color: "#fff", padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  input: { padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, outline: "none" },
  btn: { background: "#4f8ef7", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 15, cursor: "pointer", marginTop: 4 },
  error: { color: "red", fontSize: 13, textAlign: "center" },
  link: { textAlign: "center", marginTop: 16, fontSize: 13 }
};

export default Signup;