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
      <p className="text-xs text-[var(--text-dim)] mb-8">Last updated: March 2026</p>

      <div className="flex flex-col gap-6 text-sm text-[var(--text-muted)] leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">Overview</h2>
          <p>
            MRR.fyi offers monthly subscriptions for Verified and Featured badges. Payments are
            processed by{" "}
            <a
              href="https://www.lemonsqueezy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--amber)] hover:underline"
            >
              Lemon Squeezy
            </a>
            , which acts as our <strong>Merchant of Record</strong> — they handle payment
            processing, invoicing, tax collection, and related compliance on our behalf. We want
            you to be happy with your purchase. This policy explains how refunds and cancellations
            work.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">Free Trial</h2>
          <p>
            All paid plans include a <strong>7-day free trial</strong>. You will not be charged
            during the trial period. You may cancel at any time before the trial ends without
            being billed. No credit card is charged until the trial period expires.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">
            EU / EEA Consumer Rights
          </h2>
          <p>
            If you are a consumer resident in the European Union or European Economic Area, you
            have the right to withdraw from a subscription contract within 14 days of purchase
            (the &quot;cooling-off period&quot;) under the EU Consumer Rights Directive
            (2011/83/EU).
          </p>
          <p className="mt-2">
            <strong>
              By starting your subscription or free trial, you expressly request that we begin
              providing the Service immediately. You acknowledge that you lose your right of
              withdrawal once the Service has been fully performed — however, if the Service has
              only been partially performed, you remain entitled to a pro-rated refund for the
              unused portion.
            </strong>
          </p>
          <p className="mt-2">
            This statutory right is in addition to, and does not affect, any other rights you have
            under applicable consumer protection law. To exercise your right of withdrawal, email{" "}
            <a href="mailto:contact@mrr.fyi" className="text-[var(--amber)] hover:underline">
              contact@mrr.fyi
            </a>{" "}
            with the subject line &quot;Right of Withdrawal&quot; within the 14-day period.
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
            there has been a billing error, please contact us within <strong>30 days</strong> of
            the charge at{" "}
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
            </a>{" "}
            (Merchant of Record). For payment-related issues, you may also contact Lemon Squeezy
            support directly.
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
