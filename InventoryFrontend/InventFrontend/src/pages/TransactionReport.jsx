import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTransactions } from "../services/TransactionService";
import { getAllProducts } from "../services/ProductService";
import { getRole } from "../services/LoginService";

const TransactionReport = () => {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [productMap, setProductMap] = useState({});
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await getRole();
        setRole(r);

        const txRes = await getTransactions();

        // Only STOCK OUT
        const stockOutTx = (txRes.data || []).filter(
          (t) => t.type === "OUT"
        );

        setTransactions(stockOutTx);

        const prodRes = await getAllProducts();
        const map = {};
        (prodRes.data || []).forEach((p) => {
          map[String(p.id)] = p.name;
        });
        setProductMap(map);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const goBack = () => {
    if (role === "ADMIN") navigate("/admin");
    else if (role === "MANAGER") navigate("/manager");
    else navigate("/vendor");
  };

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow border">

        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">Stock Issue (Sales)</h2>
            <p className="text-sm text-slate-500">
              Only Stock OUT (IO) transactions
            </p>
          </div>

          <button
            onClick={goBack}
            className="border px-4 py-2 rounded bg-white"
          >
            ← Back
          </button>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3">IO No</th>
              <th className="p-3">Product</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Rate</th>
              <th className="p-3">Total</th>
              <th className="p-3">Handled By</th>
              <th className="p-3">Time</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  Loading...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  No Stock OUT transactions
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id}>
                  {/* 🔥 IO Code instead of numeric id */}
                  <td className="p-3 font-mono text-indigo-700">
                    {t.transactionCode || "IO-NA"}
                  </td>

                  <td className="p-3 font-semibold">
                    {productMap[String(t.productId)] || "Unknown"}
                  </td>

                  <td className="p-3">{t.quantity}</td>

                  <td className="p-3">₹ {t.rate}</td>

                  <td className="p-3 font-semibold text-emerald-700">
                    ₹ {t.transactionValue}
                  </td>

                  <td className="p-3">{t.handledBy}</td>

                  <td className="p-3">
                    {new Date(t.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      </div>
    </div>
  );
};

export default TransactionReport;
