"use client";
import { useEffect, useState } from "react";

export default function TokensPage() {
  const [balance, setBalance] = useState<number>(0);
  const [amount, setAmount] = useState<number>(500);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/wallet/balance");
    const data = await res.json();
    setBalance(data.balance || 0);
  };

  useEffect(() => { load(); }, []);

  const topup = async () => {
    setMessage(null);
    const res = await fetch("/api/wallet/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Missing keys. Provide STRIPE_SECRET_KEY in environment to enable payments.");
      return;
    }
    setMessage("Payment intent created. Complete payment client-side.");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Tokens</h1>
      <p>Balance: {balance}</p>
      <div className="flex gap-2 items-center">
        <input type="number" value={amount} onChange={(e)=>setAmount(parseInt(e.target.value||"0"))} className="border rounded px-3 py-2" />
        <button className="bg-black text-white px-4 py-2 rounded" onClick={topup}>Buy Tokens</button>
      </div>
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}


