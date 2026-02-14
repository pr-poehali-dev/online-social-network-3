import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await register(username, email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error === "Username or email already taken" ? "Имя пользователя или email уже заняты" : result.error);
      return;
    }
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--online-bg)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: "var(--online-primary)" }}>O</div>
          <h1 className="text-2xl font-bold">Online</h1>
          <p className="text-sm mt-1" style={{ color: "var(--online-muted)" }}>Создайте аккаунт</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl space-y-4" style={{ background: "var(--online-card)", border: "1px solid var(--online-border)" }}>
          {error && <div className="p-3 rounded-lg text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)" }}>{error}</div>}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--online-muted)" }}>Имя пользователя</label>
            <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} required
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--online-bg)", border: "1px solid var(--online-border)", color: "var(--online-text)" }}
              placeholder="username"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--online-muted)" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--online-bg)", border: "1px solid var(--online-border)", color: "var(--online-text)" }}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--online-muted)" }}>Пароль</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--online-bg)", border: "1px solid var(--online-border)", color: "var(--online-text)" }}
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl font-medium text-white" style={{ background: "var(--online-primary)" }}>
            {loading ? "Создание..." : "Создать аккаунт"}
          </button>
          <p className="text-center text-sm" style={{ color: "var(--online-muted)" }}>
            Есть аккаунт?{" "}
            <button type="button" onClick={() => navigate("/login")} style={{ color: "var(--online-primary)" }} className="font-medium">Войти</button>
          </p>
        </form>
      </div>
    </div>
  );
}
