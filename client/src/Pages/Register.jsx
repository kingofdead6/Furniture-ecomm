import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api, apiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register-customer", form);
      login(data.token, true);
      toast.success("Account created");
      navigate("/account", { replace: true });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border border-line bg-transparent px-4 py-3.5 text-sm outline-none transition-colors focus:border-ink";
  const labelCls = "eyebrow mb-2 block";

  return (
    <div className="mx-auto flex max-w-md flex-col px-5 py-20 md:px-8">
      <p className="eyebrow text-clay">Join</p>
      <h1 className="display mt-3 text-[clamp(2.5rem,7vw,4rem)]">Create account</h1>
      <p className="mt-3 text-muted">Track orders, save a wishlist and check out faster.</p>

      <form onSubmit={submit} className="mt-10 space-y-5">
        <div>
          <label className={labelCls}>Full name</label>
          <input required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input type="email" required autoComplete="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Phone (optional)</label>
          <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Password</label>
          <input type="password" required autoComplete="new-password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink py-4 text-xs font-semibold uppercase tracking-[0.18em] text-bone hover:bg-clay disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" className="link-underline text-ink">Sign in</Link>
      </p>
    </div>
  );
}
