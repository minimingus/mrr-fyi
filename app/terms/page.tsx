export const metadata = {
  title: "Terms of Service – MRR.fyi",
  description: "Terms of Service for MRR.fyi",
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <a
        href="/"
        className="inline-flex items-center gap-1 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] mb-8 transition-colors"
      >
        ← Back to leaderboard
      </a>

      <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-dm-serif)" }}>
        Terms of Service
      </h1>
      <p className="text-xs text-[var(--text-dim)] mb-8">Last updated: March 2025</p>

      <div className="flex flex-col gap-6 text-sm text-[var(--text-muted)] leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">1. Acceptance</h2>
          <p>
            By accessing or using MRR.fyi ("the Service"), you agree to be bound by these Terms of
            Service. If you do not agree, do not use the Service. MRR.fyi is operated by the team
            behind mrr.fyi. Questions? Email us at{" "}
            <a href="mailto:contact@mrr.fyi" className="text-[var(--amber)] hover:underline">
              contact@mrr.fyi
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">2. Account Usage</h2>
          <p>
            MRR.fyi is a public leaderboard where founders self-report their monthly recurring
            revenue (MRR). You are responsible for ensuring all information you submit is accurate
            to the best of your knowledge. Intentionally submitting false or misleading revenue
            figures may result in removal from the leaderboard without notice.
          </p>
          <p className="mt-2">
            You may not use the Service for any unlawful purpose, to spam or harass others, or in
            any way that could damage, disable, or impair the Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">3. Subscriptions</h2>
          <p>
            Paid features (Verified and Featured badges) are offered as monthly subscriptions
            processed by Lemon Squeezy. By subscribing, you authorize recurring charges to your
            payment method. You may cancel at any time; cancellation takes effect at the end of the
            current billing period.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">4. Data Handling</h2>
          <p>
            We collect the information you submit (name, product name, revenue, website URL) and
            display it publicly on the leaderboard. We also collect standard server logs and
            analytics data to operate and improve the Service. We do not sell your personal data to
            third parties.
          </p>
          <p className="mt-2">
            To request removal of your listing, email{" "}
            <a href="mailto:contact@mrr.fyi" className="text-[var(--amber)] hover:underline">
              contact@mrr.fyi
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">
            5. No Warranty
          </h2>
          <p>
            The Service is provided "as is" without warranty of any kind. We do not guarantee
            uptime, accuracy of third-party data, or fitness for any particular purpose. Use the
            Service at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">
            6. Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by law, MRR.fyi and its operators shall not be liable
            for any indirect, incidental, special, or consequential damages arising out of your use
            of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">
            7. Changes to These Terms
          </h2>
          <p>
            We may update these Terms from time to time. We will post the revised version here with
            an updated date. Continued use of the Service after changes are posted constitutes your
            acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">8. Contact</h2>
          <p>
            For any questions about these Terms, contact us at{" "}
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
