import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import { api, apiError } from "../../lib/api";
import { formatPrice, formatDate } from "../../lib/format";
import { PageHeader, Table, Row, Cell, StatusBadge, Modal, Button, TableSkeleton, AdminError, AdminEmpty } from "./ui";

const FLOW = ["pending", "confirmed", "in_delivery", "reached", "canceled"];
const LABEL = { pending: "Pending", confirmed: "Confirmed", in_delivery: "Out for delivery", reached: "Delivered", canceled: "Canceled" };

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    api.get("/orders", { params: { status: filter, search: search || undefined } })
      .then(({ data }) => setOrders(data || []))
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [filter, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeStatus = async (order, status) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/orders/${order._id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o._id === order._id ? data.order : o)));
      setActive(data.order);
      toast.success(`Marked as ${LABEL[status]}`);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Manage" title="Orders" count={loading ? "" : orders.length} />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {["all", ...FLOW].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`border px-3 py-1.5 text-xs uppercase tracking-[0.1em] transition-colors ${
                filter === s ? "border-ink bg-ink text-bone" : "border-line text-muted hover:border-ink"
              }`}
            >
              {s === "all" ? "All" : LABEL[s]}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 border border-line px-3 py-1.5">
          <Search size={15} className="text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order #, name, phone" className="bg-transparent text-sm outline-none" />
        </div>
      </div>

      {error ? (
        <AdminError message={error} onRetry={load} />
      ) : loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : orders.length === 0 ? (
        <AdminEmpty title="No orders" message="Orders will appear here as customers check out." />
      ) : (
        <Table head={["Order", "Customer", "Wilaya", "Date", "Total", "Status", ""]}>
          {orders.map((o) => (
            <Row key={o._id}>
              <Cell className="font-display text-base">{o.orderNumber}</Cell>
              <Cell>{o.customerName}<span className="block text-xs text-muted">{o.phone}</span></Cell>
              <Cell className="text-muted">{o.wilaya}</Cell>
              <Cell className="text-muted">{formatDate(o.createdAt)}</Cell>
              <Cell>{formatPrice(o.totalPrice)}</Cell>
              <Cell><StatusBadge status={o.status} label={LABEL[o.status]} /></Cell>
              <Cell><button onClick={() => setActive(o)} className="text-xs font-semibold uppercase tracking-[0.12em] hover:text-clay">View</button></Cell>
            </Row>
          ))}
        </Table>
      )}

      {/* Detail modal */}
      <Modal open={!!active} onClose={() => setActive(null)} title={active?.orderNumber || "Order"} wide>
        {active && (
          <div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-2">Customer</p>
                <p>{active.customerName}</p>
                <p className="text-sm text-muted">{active.phone}</p>
                {active.customerEmail && <p className="text-sm text-muted">{active.customerEmail}</p>}
              </div>
              <div>
                <p className="eyebrow mb-2">Delivery</p>
                <p>{active.deliveryType === "home" ? "Home delivery" : "Pickup point"} — {active.wilaya}</p>
                <p className="text-sm text-muted">{active.deliveryType === "home" ? active.address : active.desk}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="eyebrow mb-2">Items</p>
              <div className="divide-y divide-line border-y border-line">
                {active.items.map((i, idx) => (
                  <div key={idx} className="flex gap-3 py-3">
                    <div className="h-16 w-12 shrink-0 bg-paper">{i.image && <img src={i.image} alt={i.name} className="h-full w-full object-cover" />}</div>
                    <div className="flex flex-1 justify-between">
                      <div>
                        <p className="text-sm">{i.name}</p>
                        <p className="text-xs text-muted">{[i.color, i.size].filter(Boolean).join(" · ")} · Qty {i.quantity}</p>
                      </div>
                      <span className="text-sm">{formatPrice((i.price || 0) * i.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatPrice(active.subtotal)}</span></div>
                {active.discount > 0 && <div className="flex justify-between text-clay"><span>Discount {active.couponCode ? `(${active.couponCode})` : ""}</span><span>−{formatPrice(active.discount)}</span></div>}
                <div className="flex justify-between"><span className="text-muted">Delivery</span><span>{formatPrice(active.deliveryPrice)}</span></div>
                <div className="flex justify-between border-t border-line pt-2 font-display text-lg"><span>Total</span><span>{formatPrice(active.totalPrice)}</span></div>
              </div>
            </div>

            {/* Status control */}
            <div className="mt-6 border-t border-line pt-5">
              <p className="eyebrow mb-3">Update status</p>
              <div className="flex flex-wrap gap-2">
                {FLOW.map((s) => (
                  <button
                    key={s}
                    disabled={saving || active.status === s}
                    onClick={() => changeStatus(active, s)}
                    className={`border px-3 py-2 text-xs uppercase tracking-[0.1em] transition-colors ${
                      active.status === s ? "border-ink bg-ink text-bone" : "border-line hover:border-ink disabled:opacity-40"
                    }`}
                  >
                    {LABEL[s]}
                  </button>
                ))}
              </div>
              {active.statusHistory?.length > 0 && (
                <p className="mt-4 text-xs text-muted">
                  Last updated {formatDate(active.statusHistory[active.statusHistory.length - 1].at)}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setActive(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
