import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { loginUser, registerUser } from "@/lib/api/auth";
import { Lock, User, Truck, Shield, Settings, Check, X, Phone, Mail, ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Landing,
});

const ROLE_HOME: Record<string, string> = {
  staff: "/staff", transport: "/transport", security: "/security", admin: "/admin",
};

const ROLES = [
  {
    icon: User, label: "Staff", color: "#e8f0fe", iconColor: "#2563eb",
    features: ["Submit transport requests", "Track request status", "View approvals"],
  },
  {
    icon: Truck, label: "Transport Officers", color: "#e8f5e9", iconColor: "#16a34a",
    features: ["Review transport requests", "Assign vehicles and drivers", "Manage fleet schedules"],
  },
  {
    icon: Shield, label: "Security Personnel", color: "#f3e8ff", iconColor: "#9333ea",
    features: ["Record vehicle entry and exit", "Verify authorization", "Monitor gate activity"],
  },
  {
    icon: Settings, label: "Administrator", color: "#fff3e0", iconColor: "#ea580c",
    features: ["Manage users", "Configure roles", "Generate reports", "System administration"],
  },
];

function Landing() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState<"login" | "register" | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "pending" | "rejected" | null; text: string }>({ type: null, text: "" });

  const closeModal = () => { setModal(null); setStatusMsg({ type: null, text: "" }); };

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) { toast.error("Please fill in all fields"); return; }
    setLoading(true); setStatusMsg({ type: null, text: "" });
    try {
      const result = await loginUser({ data: loginForm });
      login(result.user as any, result.sessionId);
      navigate({ to: ROLE_HOME[result.user.role] ?? "/" });
    } catch (err: any) {
      const msg = err?.message ?? "Login failed";
      if (msg.startsWith("PENDING:")) setStatusMsg({ type: "pending", text: msg.replace("PENDING: ", "") });
      else if (msg.startsWith("REJECTED:")) setStatusMsg({ type: "rejected", text: msg.replace("REJECTED: ", "") });
      else toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!registerForm.name || !registerForm.email || !registerForm.password || !registerForm.confirm) { toast.error("Please fill in all fields"); return; }
    if (registerForm.password !== registerForm.confirm) { toast.error("Passwords do not match"); return; }
    if (registerForm.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const result = await registerUser({ data: { name: registerForm.name, email: registerForm.email, password: registerForm.password } });
      toast.success(result.message);
      setModal("login");
      setRegisterForm({ name: "", email: "", password: "", confirm: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif", background: "#f8f9fb" }}>
      <Toaster />
      <style>{`
        @keyframes modal-in {
          0% { opacity: 0; transform: translateY(-20px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes backdrop-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .modal-card { animation: modal-in 0.22s cubic-bezier(.22,.68,0,1.1) both; }
        .modal-backdrop { animation: backdrop-in 0.18s ease both; }
        .role-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(7,20,38,0.12) !important; }
        .role-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "#071426", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/mu-crest.png" alt="MU Crest" style={{ height: 40, width: 40, objectFit: "contain" }} />
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 17, letterSpacing: "0.02em" }}>MULUNGUSHI</span>
              <span style={{ color: "#2563eb", fontWeight: 700, fontSize: 17, letterSpacing: "0.02em" }}>MOVES</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, letterSpacing: "0.05em" }}>Fleet &amp; Gate Management System</div>
          </div>
        </div>
      </nav>

      {/* ── HERO (100vh) ── */}
      <section style={{ height: "100vh", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
        {/* Gate photo background */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(/mu-gate.jpg)", backgroundSize: "cover", backgroundPosition: "center 30%", backgroundRepeat: "no-repeat" }} />
        {/* Dark overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(7,20,38,0.80) 0%, rgba(7,20,38,0.55) 60%, rgba(7,20,38,0.25) 100%)" }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 1280, margin: "0 auto", padding: "0 32px", width: "100%", paddingTop: 64 }}>
          <div style={{ maxWidth: 580 }}>
            <h1 style={{ color: "#fff", fontWeight: 800, fontSize: "clamp(2.4rem, 5vw, 3.8rem)", lineHeight: 1.1, margin: "0 0 8px", fontFamily: "Plus Jakarta Sans, Inter, sans-serif" }}>
              Smart Fleet &amp; Gate Management
            </h1>
            <h1 style={{ color: "#2563eb", fontWeight: 800, fontSize: "clamp(2.4rem, 5vw, 3.8rem)", lineHeight: 1.1, margin: "0 0 24px", fontFamily: "Plus Jakarta Sans, Inter, sans-serif" }}>
              for Mulungushi University
            </h1>
            <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 17, lineHeight: 1.7, margin: "0 0 40px" }}>
              Manage vehicle dispatch, fleet operations, and campus access from one secure platform.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button onClick={() => setModal("login")}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 28px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(37,99,235,0.40)" }}>
                <Lock size={16} /> Sign In
              </button>
              <a href="#system-access"
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 28px", background: "rgba(255,255,255,0.10)", color: "#fff", border: "1px solid rgba(255,255,255,0.30)", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", textDecoration: "none", backdropFilter: "blur(4px)" }}>
                Learn More <ChevronDown size={16} />
              </a>
            </div>
          </div>
        </div>

       
      </section>

      {/* ── SYSTEM ACCESS ── */}
      <section id="system-access" style={{ background: "#f8f9fb", padding: "88px 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ width: 48, height: 4, background: "#2563eb", borderRadius: 2, margin: "0 auto 20px" }} />
            <h2 style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: 800, fontSize: 34, color: "#071426", margin: "0 0 12px" }}>System Access</h2>
            <p style={{ fontSize: 16, color: "rgba(7,20,38,0.55)", margin: 0 }}>Designed for authorized university personnel.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {ROLES.map(({ icon: Icon, label, color, iconColor, features }) => (
              <div key={label} className="role-card"
                style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(7,20,38,0.07)", border: "1px solid rgba(7,20,38,0.06)" }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <Icon size={26} color={iconColor} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 16, color: "#071426", margin: "0 0 16px", fontFamily: "Plus Jakarta Sans, sans-serif" }}>{label}</h3>
                <div style={{ width: 32, height: 2, background: "#2563eb", borderRadius: 1, marginBottom: 16 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <Check size={15} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 13.5, color: "rgba(7,20,38,0.65)", lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#071426" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px", display: "flex", justifyContent: "center", gap: 0, flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {[
            { icon: Phone, text: "Contact ICT Directorate" },
            { icon: Mail, text: "ict@mu.ac.zm" },
            { icon: Phone, text: "+260 211 290 258" },
          ].map(({ icon: Icon, text }, i) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 32px", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.10)" : "none" }}>
              <Icon size={15} color="#2563eb" />
              <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>{text}</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", padding: "20px 32px" }}>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>© 2026 Mulungushi University. All Rights Reserved.</p>
        </div>
      </footer>

      {/* ── MODAL OVERLAY ── */}
      {modal && (
        <div className="modal-backdrop"
          style={{ position: "fixed", inset: 0, background: "rgba(7,20,38,0.60)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal-card"
            style={{ background: "#fff", borderRadius: 20, padding: 36, width: "100%", maxWidth: 440, position: "relative", boxShadow: "0 32px 80px rgba(7,20,38,0.30), 0 4px 16px rgba(7,20,38,0.12)" }}>

            {/* Close */}
            <button onClick={closeModal}
              style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: "50%", background: "rgba(7,20,38,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={15} color="rgba(7,20,38,0.50)" />
            </button>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <img src="/mu-crest.png" alt="MU" style={{ height: 42, width: 42, objectFit: "contain" }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#2563eb", marginBottom: 2 }}>
                  {modal === "login" ? "Portal Access" : "New Account"}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#071426", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                  {modal === "login" ? "Sign In" : "Register"}
                </div>
              </div>
            </div>

            {/* Tab switcher */}
            <div style={{ display: "flex", gap: 6, background: "rgba(7,20,38,0.05)", borderRadius: 8, padding: 4, marginBottom: 24 }}>
              {(["login", "register"] as const).map((t) => (
                <button key={t} onClick={() => { setModal(t); setStatusMsg({ type: null, text: "" }); }}
                  style={{ flex: 1, padding: "7px 0", borderRadius: 6, fontSize: 13, fontWeight: modal === t ? 600 : 500, cursor: "pointer", border: "none", background: modal === t ? "#fff" : "transparent", color: modal === t ? "#071426" : "rgba(7,20,38,0.50)", boxShadow: modal === t ? "0 1px 3px rgba(7,20,38,0.10)" : "none", transition: "all 0.15s" }}>
                  {t === "login" ? "Sign In" : "Register"}
                </button>
              ))}
            </div>

            {/* Login form */}
            {modal === "login" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div><Label>Email address</Label><Input type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="you@mulungushi.ac.zm" autoFocus /></div>
                <div><Label>Password</Label><Input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="••••••••" /></div>
                {statusMsg.type === "pending" && (
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#d97706" }}>⏳ {statusMsg.text}</div>
                )}
                {statusMsg.type === "rejected" && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>✕ {statusMsg.text}</div>
                )}
                <button onClick={handleLogin} disabled={loading}
                  style={{ width: "100%", padding: "12px", background: loading ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Lock size={15} /> {loading ? "Signing in..." : "Sign In"}
                </button>
                <p style={{ textAlign: "center", fontSize: 13, color: "rgba(7,20,38,0.45)", margin: 0 }}>
                  No account?{" "}
                  <button onClick={() => setModal("register")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Register here</button>
                </p>
              </div>
            )}

            {/* Register form */}
            {modal === "register" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div><Label>Full Name</Label><Input value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} placeholder="Given Nkonde" autoFocus /></div>
                <div><Label>Email address</Label><Input type="email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} placeholder="you@mulungushi.ac.zm" /></div>
                <div><Label>Password</Label><Input type="password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} placeholder="Min. 8 characters" /></div>
                <div><Label>Confirm Password</Label><Input type="password" value={registerForm.confirm} onChange={(e) => setRegisterForm({ ...registerForm, confirm: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleRegister()} placeholder="••••••••" /></div>
                <button onClick={handleRegister} disabled={loading}
                  style={{ width: "100%", padding: "12px", background: loading ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", marginTop: 2 }}>
                  {loading ? "Registering..." : "Create Account →"}
                </button>
                <p style={{ textAlign: "center", fontSize: 12, color: "rgba(7,20,38,0.45)", margin: 0 }}>Your account will be reviewed by an administrator before you can log in.</p>
                <p style={{ textAlign: "center", fontSize: 13, color: "rgba(7,20,38,0.45)", margin: 0 }}>
                  Already have an account?{" "}
                  <button onClick={() => setModal("login")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Sign in</button>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}