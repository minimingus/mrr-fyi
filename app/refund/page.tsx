export const metadata = {
  title: "Refund Policy – MRR.fyi",
  description: "Refund Policy for MRR.fyi",
};

export default function RefundPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <a
        href="/"
        className="inline-flex items-center gap-1 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] mb-8 transition-colors"
      >
        ← Back to leaderboard
      </a>

      <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-dm-serif)" }}>
        Refund Policy
      </h1>
      <p className="text-xs text-[var(--text-dim)] mb-8">Last updated: March 2025</p>

      <div className="flex flex-col gap-6 text-sm text-[var(--text-muted)] leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">Overview</h2>
          <p>
            MRR.fyi offers monthly subscriptions for Verified and Featured badges. We want you to
            be happy with your purchase. This policy explains how refunds and cancellations work.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">Free Trial</h2>
          <p>
            All paid plans include a 7-day free trial. You will not be charged during the trial
            period. You may cancel at any time before the trial ends without being billed.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">Cancellations</h2>
          <p>
            You may cancel your subscription at any time from your account settings or by emailing{" "}
            <a href="mailto:contact@mrr.fyi" className="text-[var(--amber)] hover:underline">
              contact@mrr.fyi
            </a>
            . Cancellation takes effect at the end of the current billing period. You will retain
            access to paid features until that date.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">Refunds</h2>
          <p>
            Because MRR.fyi is a subscription service with immediately delivered digital benefits,
            we generally do not offer refunds after a billing cycle has started. If you believe
            there has been a billing error, please contact us within 7 days of the charge at{" "}
            <a href="mailto:contact@mrr.fyi" className="text-[var(--amber)] hover:underline">
              contact@mrr.fyi
            </a>{" "}
            and we will review your case.
          </p>
          <p className="mt-2">
            Prorated refunds for partial billing periods are at our sole discretion and will be
            considered on a case-by-case basis.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">Payment Processing</h2>
          <p>
            All payments are processed securely by{" "}
            <a
              href="https://www.lemonsqueezy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--amber)] hover:underline"
            >
              Lemon Squeezy
            </a>
            . For payment-related issues, you may also contact Lemon Squeezy support directly.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">Contact</h2>
          <p>
            Questions about this policy? Email us at{" "}
            <a href="mailto:contact@mrr.fyi" className="text-[var(--amber)] hover:underline">
              contact@mrr.fyi
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
