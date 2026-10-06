"use client";

import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CheckoutButton({
  plan,
  label,
  className = "",
}: {
  plan: "STARTER" | "PRO";
  label: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (response.status === 401) {
        router.push("/login?next=%2Fdashboard");
        return;
      }
      if (!response.ok || !result.url) throw new Error(result.error ?? "Checkout is niet beschikbaar.");
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout is niet beschikbaar.");
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <button className="button button-dark" disabled={busy} onClick={checkout} type="button">
        {busy ? <LoaderCircle aria-hidden="true" className="animate-spin" size={15} /> : <ArrowUpRight aria-hidden="true" size={15} />}
        {busy ? "Bezig..." : label}
      </button>
      {error ? <p className="inline-error" role="alert">{error}</p> : null}
    </div>
  );
}
