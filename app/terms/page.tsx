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
        ← Back to profiles
      </a>

      <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-dm-serif)" }}>
        Terms of Service
      </h1>
      <p className="text-xs text-[var(--text-dim)] mb-8">Last updated: March 2026</p>

      <div className="flex flex-col gap-6 text-sm text-[var(--text-muted)] leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">1. Acceptance</h2>
          <p>
            By accessing or using MRR.fyi (&quot;the Service&quot;), you agree to be bound by
            these Terms of Service. If you do not agree, do not use the Service. MRR.fyi is
            operated by <strong>[Legal Entity Name]</strong>, [Registered Address]
            (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). Questions? Email us at{" "}
            <a href="mailto:contact@mrr.fyi" className="text-[var(--amber)] hover:underline">
              contact@mrr.fyi
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">2. Account Usage</h2>
          <p>
            MRR.fyi is a platform where founders verify and display their monthly recurring
            revenue (MRR). You are responsible for ensuring all information you submit is accurate
            to the best of your knowledge. Intentionally submitting false or misleading revenue
            figures may result in removal from the platform without notice.
          </p>
          <p className="mt-2">
            You may not use the Service for any unlawful purpose, to spam or harass others, or in
            any way that could damage, disable, or impair the Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">3. Subscriptions and Free Trial</h2>
          <p>
            Paid features (Verified and Featured badges) are offered as monthly subscriptions
            processed by Lemon Squeezy, which acts as our Merchant of Record. All paid plans
            include a <strong>7-day free trial</strong>. You will not be charged during the trial
            period and may cancel at any time before the trial ends without incurring any charge.
          </p>
          <p className="mt-2">
            After the trial period, you authorise recurring charges to your payment method on a
            monthly basis. You may cancel at any time from your account settings or by emailing{" "}
            <a href="mailto:contact@mrr.fyi" className="text-[var(--amber)] hover:underline">
              contact@mrr.fyi
            </a>
            ; cancellation takes effect at the end of the current billing period.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">4. Data Handling</h2>
          <p>
            We collect the information you submit (name, product name, revenue, website URL) and
            display it publicly on the platform. We also collect standard server logs and
            analytics data to operate and improve the Service. We do not sell your personal data
            to third parties. For full details of how we handle your data, please see our{" "}
            <a href="/privacy" className="text-[var(--amber)] hover:underline">
              Privacy Policy
            </a>
            .
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
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">5. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time, with or without
            cause, and with or without notice, if we believe you have violated these Terms or if
            required by law. You may terminate your account at any time by cancelling your
            subscription and emailing us a deletion request.
          </p>
          <p className="mt-2">
            Upon termination, your right to use the Service ceases immediately. Sections 6, 7, 8,
            and 9 survive termination.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">6. No Warranty</h2>
          <p>
            The Service is provided &quot;as is&quot; without warranty of any kind. We do not
            guarantee uptime, accuracy of third-party data, or fitness for any particular purpose.
            Use the Service at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">
            7. Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by law, MRR.fyi and its operators shall not be liable
            for any indirect, incidental, special, or consequential damages arising out of your use
            of the Service. Our total aggregate liability to you for any claims arising out of or
            related to the Service shall not exceed the greater of (a) the total amounts you paid
            us in the twelve (12) months preceding the claim, or (b) USD $50.
          </p>
          <p className="mt-2">
            Nothing in these Terms limits or excludes liability that cannot be limited or excluded
            under applicable law, including liability for death or personal injury caused by
            negligence, or for fraud or fraudulent misrepresentation.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">
            8. Governing Law and Disputes
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of{" "}
            <strong>[Governing Jurisdiction — e.g., the State of Delaware, USA]</strong>, without
            regard to its conflict-of-law provisions. Any dispute arising out of or in connection
            with these Terms shall be subject to the exclusive jurisdiction of the courts of{" "}
            <strong>[Dispute Venue — e.g., the courts of Delaware, USA]</strong>.
          </p>
          <p className="mt-2">
            If you are a consumer resident in the EU or UK, you retain the right to bring
            proceedings in the courts of your country of residence and to benefit from any
            mandatory consumer protection provisions that apply in your jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">
            9. Changes to These Terms
          </h2>
          <p>
            We may update these Terms from time to time. For material changes, we will provide at
            least <strong>30 days&apos; advance notice</strong> by posting the revised version
            here and, where practicable, by email to your registered address. For non-material
            changes, we will post the revised version with an updated date. Continued use of the
            Service after the effective date of any change constitutes your acceptance of the
            updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">10. Contact</h2>
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
