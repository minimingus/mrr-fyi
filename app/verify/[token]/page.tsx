"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trackEvent } from "@/lib/plausible";

function buildTwitterIntentUrl(text: string, url: string) {
  const params = new URLSearchParams({ text: `${text}\n${url}` });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export default function VerifyPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = await res.json();
        if (!res.ok) {
          setStatus("error");
          setError(json.error ?? "Verification failed");
          return;
        }
        setStatus("success");
        setSlug(json.slug);
        setTimeout(() => {
          router.push(`/${json.slug}?submitted=1`);
        }, 6000);
      } catch {
        setStatus("error");
        setError("Network error. Please try again.");
      }
    }
    verify();
  }, [token, router]);

  const profileUrl = slug ? `https://mrr.fyi/${slug}` : "";
  const tweetUrl = slug
    ? buildTwitterIntentUrl(
        "Just created my MRR profile on @mrrfyi — tracking my revenue in public. #buildinpublic",
        profileUrl
      )
    : "";

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      {status === "loading" && (
        <>
          <div className="mb-6 text-5xl animate-pulse">⏳</div>
          <h1
            className="text-3xl mb-3"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Verifying...
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Hang tight, we&apos;re confirming your email.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="mb-6 text-5xl">✅</div>
          <h1
            className="text-3xl mb-3"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Your profile is live
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Your profile is live. Let the world know you&apos;re building in public.
          </p>

          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("Share Click", { platform: "twitter", source: "verify" })}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--amber)] text-black text-sm font-semibold rounded-md hover:bg-amber-400 transition-colors mb-4"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </a>

          <p className="text-xs text-[var(--text-dim)]">
            Redirecting to your profile...{" "}
            <a
              href={`/${slug}?submitted=1`}
              className="text-[var(--amber)] hover:underline"
            >
              Go now →
            </a>
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="mb-6 text-5xl">❌</div>
          <h1
            className="text-3xl mb-3"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Verification failed
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            {error}
          </p>
          <a
            href="/resend"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--amber)] text-black text-sm font-semibold rounded-md hover:bg-amber-400 transition-colors"
          >
            Request a new link →
          </a>
        </>
      )}
    </div>
  );
}
