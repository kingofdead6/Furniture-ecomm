import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { api, apiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.token, remember);
      toast.success("Welcome back");
      const dest =
        data.usertype === "admin" || data.usertype === "superadmin"
          ? "/admin/dashboard"
          : location.state?.from || "/account";
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(apiError(err, "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border border-line bg-transparent px-4 py-3.5 text-sm outline-none transition-colors focus:border-ink";
  const labelCls = "eyebrow mb-2 block";

  return (
    <div className="mx-auto flex max-w-md flex-col px-5 py-20 md:px-8">
      <p className="eyebrow text-clay">Account</p>
      <h1 className="display mt-3 text-[clamp(2.5rem,7vw,4rem)]">Sign in</h1>

      <form onSubmit={submit} className="mt-10 space-y-5">
        <div>
          <label className={labelCls}>Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            className={inputCls}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Password</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            className={inputCls}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-[var(--ink)]" />
          Keep me signed in
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink py-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone btn-solid disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-8 text-sm text-muted">
        New here?{" "}
        <Link to="/register" className="link-underline text-ink">Create an account</Link>
      </p>
    </div>
  );
}
