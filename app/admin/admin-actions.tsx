"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminActions({
  founderId,
  founderName,
  secret,
}: {
  founderId: string;
  founderName: string;
  secret: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${founderName}"? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/founders/${founderId}`, {
        method: "DELETE",
        headers: { "x-admin-secret": secret },
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to delete founder");
        return;
      }

      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50"
      style={{
        color: "var(--red)",
        background: "rgba(239, 68, 68, 0.1)",
      }}
    >
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
