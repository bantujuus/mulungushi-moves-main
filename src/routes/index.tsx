import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { loginUser, registerUser } from "@/lib/api/auth";
import { CarFront, ShieldCheck, ClipboardCheck, ScanLine, ArrowRight, Stamp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Landing,
});

const ROLE_HOME: Record<string, string> = {
  staff: "/staff", transport: "/transport", security: "/security", admin: "/admin",
};

function Landing() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "pending" | "rejected" | null; text: string }>({ type: null, text: "" });

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    setStatusMsg({ type: null, text: "" });
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
      setTab("login");
      setRegisterForm({ name: "", email: "", password: "", confirm: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf7]">
      <Toaster />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[#0b1830] text-white">
        {/* Ambient grid texture */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-[#d4a843]/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-24">
          {/* Brand bar */}
          <div className="flex items-center gap-3 mb-16">
            <div className="h-10 w-10 rounded-md bg-[#d4a843] flex items-center justify-center text-[#0b1830] font-display font-bold text-sm">MU</div>
            <div>
              <div className="font-display font-semibold leading-tight text-sm tracking-wide">MULUNGUSHI UNIVERSITY</div>
              <div className="text-[11px] text-white/50 tracking-widest uppercase">Transport &amp; Security Office</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-16 items-center">
            {/* Left: headline + CTA */}
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#d4a843]/40 text-[#d4a843] text-[11px] font-semibold tracking-[0.15em] uppercase mb-7">
                Digital Fleet &amp; Gate System
              </span>
              <h1 className="font-display font-extrabold leading-[0.98] tracking-tight text-[clamp(2.6rem,5.5vw,4.2rem)]">
                Every dispatch.
                <br />
                <span className="text-[#d4a843]">Logged, not lost.</span>
              </h1>
              <p className="mt-7 text-base md:text-lg text-white/65 max-w-xl leading-relaxed">
                The university logbook moves online. Staff request a vehicle, Transport approves and assigns it,
                Security verifies it at the gate &mdash; every step timestamped and traceable, replacing the
                paper ledger that used to sit at the boom gate.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                {[
                  { icon: ClipboardCheck, label: "Request" },
                  { icon: ShieldCheck, label: "Approve" },
                  { icon: ScanLine, label: "Verify" },
                ].map(({ icon: Icon, label }, i) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-white/70">
                    <div className="h-8 w-8 rounded-md bg-white/10 flex items-center justify-center">
                      <Icon className="h-4 w-4" />
                    </div>
                    {label}
                    {i < 2 && <ArrowRight className="h-3.5 w-3.5 text-white/30 ml-1" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: signature element — animated dispatch ledger card */}
            <div className="relative hidden lg:block">
              <div className="relative bg-white rounded-2xl shadow-2xl p-6 rotate-[-3deg] text-[#0b1830] max-w-sm ml-auto">
                <div className="flex items-center justify-between border-b border-dashed border-black/15 pb-3 mb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-black/40">Dispatch Ticket</div>
                    <div className="font-display font-bold text-sm">MU-2026-0481</div>
                  </div>
                  <CarFront className="h-6 w-6 text-[#0b1830]/30" />
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between"><span className="text-black/40">Vehicle</span><span className="font-medium">MU 001 ZM</span></div>
                  <div className="flex justify-between"><span className="text-black/40">Driver</span><span className="font-medium">P. Mwale</span></div>
                  <div className="flex justify-between"><span className="text-black/40">Destination</span><span className="font-medium">Kafue Gorge</span></div>
                  <div className="flex justify-between"><span className="text-black/40">Gate</span><span className="font-medium">Main Entrance</span></div>
                </div>

                {/* Stamp */}
                <div className="absolute -bottom-5 -right-5 animate-[stamp-in_0.6s_ease-out_0.3s_both]">
                  <div className="h-20 w-20 rounded-full border-[3px] border-[#1f7a4d] flex items-center justify-center rotate-[-12deg] bg-white/95">
                    <div className="text-center leading-none">
                      <Stamp className="h-3.5 w-3.5 text-[#1f7a4d] mx-auto mb-0.5" />
                      <div className="text-[8px] font-extrabold tracking-wider text-[#1f7a4d]">APPROVED</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating mini-card behind */}
              <div className="absolute top-10 -left-6 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 rotate-[4deg] text-xs text-white/70">
                Gate log · 06:42 · Exit recorded
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AUTH + HOW IT WORKS ── */}
      <section className="max-w-7xl mx-auto px-6 py-20 flex flex-col md:flex-row gap-16">
        <div className="flex-1">
          <h2 className="text-2xl font-display font-bold text-[#0b1830] mb-1">
            {tab === "login" ? "Sign in to your portal" : "Create an account"}
          </h2>
          <p className="text-[#0b1830]/55 mb-6 text-sm">
            {tab === "login" ? "Enter your credentials to access your role dashboard." : "New accounts require administrator approval before access is granted."}
          </p>

          <div className="flex gap-2 mb-6">
            <button onClick={() => { setTab("login"); setStatusMsg({ type: null, text: "" }); }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === "login" ? "bg-[#0b1830] text-white" : "bg-[#0b1830]/5 text-[#0b1830]/60 hover:bg-[#0b1830]/10"}`}>
              Sign In
            </button>
            <button onClick={() => { setTab("register"); setStatusMsg({ type: null, text: "" }); }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === "register" ? "bg-[#0b1830] text-white" : "bg-[#0b1830]/5 text-[#0b1830]/60 hover:bg-[#0b1830]/10"}`}>
              Register
            </button>
          </div>

          <Card className="p-6 max-w-md border-[#0b1830]/10 shadow-sm">
            {tab === "login" ? (
              <div className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="you@mulungushi.ac.zm" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="••••••••" />
                </div>
                {statusMsg.type === "pending" && (
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">⏳ {statusMsg.text}</div>
                )}
                {statusMsg.type === "rejected" && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">✕ {statusMsg.text}</div>
                )}
                <Button className="w-full bg-[#0b1830] hover:bg-[#0b1830]/90" onClick={handleLogin} disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div><Label>Full Name</Label><Input value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} placeholder="Given Nkonde" /></div>
                <div><Label>Email</Label><Input type="email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} placeholder="you@mulungushi.ac.zm" /></div>
                <div><Label>Password</Label><Input type="password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} placeholder="Min. 8 characters" /></div>
                <div><Label>Confirm Password</Label><Input type="password" value={registerForm.confirm} onChange={(e) => setRegisterForm({ ...registerForm, confirm: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleRegister()} placeholder="••••••••" /></div>
                <Button className="w-full bg-[#0b1830] hover:bg-[#0b1830]/90" onClick={handleRegister} disabled={loading}>
                  {loading ? "Registering..." : "Create Account"}
                </Button>
                <p className="text-xs text-[#0b1830]/50 text-center">Your account will be reviewed by an administrator before you can log in.</p>
              </div>
            )}
          </Card>
        </div>

        {/* How it works — eyebrow-labeled, real sequence so numbering is justified */}
        <div className="md:w-96">
          <div className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#1f7a4d] mb-4">The Dispatch Sequence</div>
          <div className="space-y-0">
            {[
              { n: "01", h: "Request", p: "Staff submit a dispatch request with trip details \u2014 destination, passengers, departure window.", icon: ClipboardCheck },
              { n: "02", h: "Approve & Assign", p: "Transport Officer reviews the request and assigns a vehicle and driver from the available fleet.", icon: ShieldCheck },
              { n: "03", h: "Verify at the Gate", p: "Security checks the approved dispatch and logs the exact exit and return time.", icon: ScanLine },
            ].map(({ n, h, p, icon: Icon }, i, arr) => (
              <div key={n} className="flex gap-4 relative pb-8 last:pb-0">
                {i < arr.length - 1 && <div className="absolute left-[19px] top-10 bottom-0 w-px bg-[#0b1830]/10" />}
                <div className="h-10 w-10 rounded-full bg-[#0b1830] text-[#d4a843] flex items-center justify-center text-xs font-display font-bold shrink-0 z-10">{n}</div>
                <div className="pt-1.5">
                  <div className="font-display font-semibold text-[#0b1830] text-sm">{h}</div>
                  <p className="mt-1 text-sm text-[#0b1830]/55 leading-relaxed">{p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#0b1830]/10 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6 text-xs text-[#0b1830]/45 flex justify-between flex-wrap gap-2">
          <div>Mulungushi University · Transport &amp; Security Office</div>
          <div>Digital Fleet &amp; Gate Management System</div>
        </div>
      </footer>

      <style>{`
        @keyframes stamp-in {
          0% { opacity: 0; transform: scale(2) rotate(-12deg); }
          60% { opacity: 1; transform: scale(0.9) rotate(-12deg); }
          100% { opacity: 1; transform: scale(1) rotate(-12deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="stamp-in"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}