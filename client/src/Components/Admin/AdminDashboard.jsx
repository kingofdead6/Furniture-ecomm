import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiError } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { formatPrice, formatDate } from "../../lib/format";
import { PageHeader, StatCard, Table, Row, Cell, StatusBadge, TableSkeleton, AdminError } from "./ui";

const STATUS_LABEL = {
  pending: "Pending", confirmed: "Confirmed", in_delivery: "Out for delivery",
  reached: "Delivered", canceled: "Canceled",
};

export default function AdminDashboard() {
  const { usertype } = useAuth();
  const superAdmin = usertype === "superadmin";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    const calls = [api.get("/orders"), api.get("/products", { params: { status: "all", limit: 60 } })];
    if (superAdmin) calls.push(api.get("/auth/customers"));
    Promise.all(calls)
      .then(([o, p, c]) => {
        setData({ orders: o.data || [], products: p.data.products || [], customers: c?.data || [] });
      })
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <><PageHeader eyebrow="Admin" title="Overview" /><AdminError message={error} onRetry={load} /></>;

  const orders = data?.orders || [];
  const products = data?.products || [];
  const revenue = orders.filter((o) => o.status !== "canceled").reduce((s, o) => s + (o.totalPrice || 0), 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const lowStock = products.filter((p) => (p.stock ?? 0) <= 5).length;

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Overview" />

      {loading ? (
        <TableSkeleton rows={2} cols={4} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Revenue" numeric={revenue} format={formatPrice} sub={`${orders.length} orders total`} />
            <StatCard label="Pending orders" numeric={pending} sub="Awaiting confirmation" />
            <StatCard label="Products" numeric={products.length} sub={`${lowStock} low on stock`} />
            <StatCard
              label="Customers"
              numeric={superAdmin ? data.customers.length : undefined}
              value="—"
              sub={superAdmin ? "Registered accounts" : "Superadmin only"}
            />
          </div>

          {/* Status breakdown */}
          <div className="mt-10">
            <p className="eyebrow mb-4">Orders by status</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {Object.keys(STATUS_LABEL).map((s) => (
                <div key={s} className="border border-line p-4 text-center">
                  <p className="font-display text-3xl">{orders.filter((o) => o.status === s).length}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">{STATUS_LABEL[s]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent orders */}
          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <p className="eyebrow">Recent orders</p>
              <Link to="/admin/orders" className="link-underline text-xs font-semibold uppercase tracking-[0.14em]">All orders</Link>
            </div>
            {orders.length === 0 ? (
              <p className="border border-dashed border-line py-12 text-center text-muted">No orders yet.</p>
            ) : (
              <Table head={["Order", "Customer", "Date", "Total", "Status"]}>
                {orders.slice(0, 6).map((o) => (
                  <Row key={o._id}>
                    <Cell className="font-display text-base">{o.orderNumber}</Cell>
                    <Cell>{o.customerName}</Cell>
                    <Cell className="text-muted">{formatDate(o.createdAt)}</Cell>
                    <Cell>{formatPrice(o.totalPrice)}</Cell>
                    <Cell><StatusBadge status={o.status} label={STATUS_LABEL[o.status]} /></Cell>
                  </Row>
                ))}
              </Table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
