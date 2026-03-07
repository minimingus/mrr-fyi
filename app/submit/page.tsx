"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitSchema, SubmitInput } from "@/lib/validations";
import { useRouter } from "next/navigation";

export default function SubmitPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmitInput>({
    resolver: zodResolver(submitSchema),
    defaultValues: { currency: "USD" },
  });

  async function onSubmit(data: SubmitInput) {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
        return;
      }
      router.push(`/${json.slug}?submitted=1`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-md px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--amber)] transition-colors";
  const labelClass = "block text-xs text-[var(--text-muted)] mb-1.5 font-medium tracking-wide";
  const errorClass = "text-xs text-[var(--red)] mt-1";

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <a
        href="/"
        className="inline-flex items-center gap-1 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] mb-8 transition-colors"
      >
        ← Back to leaderboard
      </a>

      <div className="mb-8">
        <h1
          className="text-3xl mb-2"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Add your revenue.
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Self-reported and public. Takes 60 seconds. Updates the leaderboard instantly.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Product info */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 flex flex-col gap-4">
          <h2 className="text-xs mono uppercase tracking-widest text-[var(--text-dim)]">
            Product
          </h2>

          <div>
            <label className={labelClass}>Product Name *</label>
            <input
              {...register("productName")}
              placeholder="e.g. Screenshotify"
              className={inputClass}
            />
            {errors.productName && (
              <p className={errorClass}>{errors.productName.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Product URL *</label>
            <input
              {...register("productUrl")}
              placeholder="https://screenshotify.io"
              className={inputClass}
            />
            {errors.productUrl && (
              <p className={errorClass}>{errors.productUrl.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Short Description</label>
            <textarea
              {...register("description")}
              placeholder="One sentence about what it does (max 280 chars)"
              rows={2}
              className={inputClass + " resize-none"}
            />
            {errors.description && (
              <p className={errorClass}>{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Revenue */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 flex flex-col gap-4">
          <h2 className="text-xs mono uppercase tracking-widest text-[var(--text-dim)]">
            Revenue
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>Monthly Revenue (MRR) *</label>
              <input
                {...register("mrr", { valueAsNumber: true })}
                type="number"
                placeholder="1500"
                min="0"
                className={inputClass + " mono"}
              />
              {errors.mrr && (
                <p className={errorClass}>{errors.mrr.message}</p>
              )}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>Currency</label>
              <select {...register("currency")} className={inputClass}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-[var(--text-dim)]">
            Enter your actual monthly recurring revenue. This is self-reported and
            on your honour.
          </p>
        </div>

        {/* Founder info */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 flex flex-col gap-4">
          <h2 className="text-xs mono uppercase tracking-widest text-[var(--text-dim)]">
            About You
          </h2>

          <div>
            <label className={labelClass}>Your Name *</label>
            <input
              {...register("name")}
              placeholder="e.g. Marc Lou"
              className={inputClass}
            />
            {errors.name && (
              <p className={errorClass}>{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Twitter / X Handle</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] text-sm">
                @
              </span>
              <input
                {...register("twitter")}
                placeholder="marclou"
                className={inputClass + " pl-7"}
              />
            </div>
            {errors.twitter && (
              <p className={errorClass}>{errors.twitter.message}</p>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-[var(--red)] bg-red-950/20 px-4 py-3 text-sm text-[var(--red)]">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-[var(--amber)] text-black font-semibold rounded-md hover:bg-amber-400 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          {isSubmitting ? "Submitting..." : "Add to Leaderboard →"}
        </button>

        <p className="text-xs text-center text-[var(--text-dim)]">
          Your profile will be public immediately. Revenue is self-reported.
        </p>
      </form>
    </div>
  );
}
