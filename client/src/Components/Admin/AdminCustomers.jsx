import { useEffect, useState } from "react";
import { api, apiError } from "../../lib/api";
import { formatPrice, formatDate } from "../../lib/format";
import { PageHeader, Table, Row, Cell, TableSkeleton, AdminError, AdminEmpty } from "./ui";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    api.get("/auth/customers").then(({ data }) => setCustomers(data || [])).catch((e) => setError(apiError(e))).finally(() => setLoading(false));
  };
  useEffect(load, []);

  return (
    <div>
      <PageHeader eyebrow="Directory" title="Customers" count={loading ? "" : customers.length} />

      {error ? <AdminError message={error} onRetry={load} />
        : loading ? <TableSkeleton rows={6} cols={5} />
        : customers.length === 0 ? <AdminEmpty title="No customers yet" message="Registered customers will appear here." />
        : (
          <Table head={["Name", "Email", "Phone", "Orders", "Spent", "Joined"]}>
            {customers.map((c) => (
              <Row key={c._id}>
                <Cell className="font-display text-base">{c.name || "—"}</Cell>
                <Cell className="text-muted">{c.email}</Cell>
                <Cell className="text-muted">{c.phone || "—"}</Cell>
                <Cell>{c.orderCount}</Cell>
                <Cell>{formatPrice(c.totalSpent)}</Cell>
                <Cell className="text-muted">{formatDate(c.createdAt)}</Cell>
              </Row>
            ))}
          </Table>
        )}
    </div>
  );
}
