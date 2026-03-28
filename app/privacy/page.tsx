export const metadata = {
  title: "Privacy Policy – MRR.fyi",
  description: "Privacy Policy for MRR.fyi",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <a
        href="/"
        className="inline-flex items-center gap-1 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] mb-8 transition-colors"
      >
        ← Back to profiles
      </a>

      <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-dm-serif)" }}>
        Privacy Policy
      </h1>
      <p className="text-xs text-[var(--text-dim)] mb-8">Last updated: March 2026</p>

      <div className="flex flex-col gap-6 text-sm text-[var(--text-muted)] leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">1. Who We Are</h2>
          <p>
            MRR.fyi (&quot;the Service&quot;, &quot;we&quot;, &quot;us&quot;) is operated by{" "}
            <strong>[Legal Entity Name]</strong>, [Registered Address]. For privacy-related
            enquiries, contact us at{" "}
            <a href="mailto:contact@mrr.fyi" className="text-[var(--amber)] hover:underline">
              contact@mrr.fyi
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">
            2. Data We Collect and Why
          </h2>
          <p>We collect the following categories of personal data:</p>
          <ul className="list-disc list-inside mt-2 flex flex-col gap-1">
            <li>
              <strong>Account &amp; profile data</strong> — name, email address, product name,
              website URL, and self-reported MRR figures you submit. Legal basis:{" "}
              <em>performance of a contract</em> (Art. 6(1)(b) GDPR).
            </li>
            <li>
              <strong>Payment data</strong> — billing details collected and processed by Lemon
              Squeezy on our behalf. Legal basis: <em>performance of a contract</em>.
            </li>
            <li>
              <strong>Usage &amp; analytics data</strong> — server logs, page views, referrer
              URLs, and browser type. Legal basis:{" "}
              <em>legitimate interests</em> (Art. 6(1)(f) GDPR) — operating and improving the
              Service.
            </li>
            <li>
              <strong>Communications</strong> — emails you send to us and replies we send you.
              Legal basis: <em>legitimate interests</em>.
            </li>
          </ul>
          <p className="mt-2">
            We do not collect sensitive personal data (special-category data under Art. 9 GDPR).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">
            3. How We Use Your Data
          </h2>
          <ul className="list-disc list-inside flex flex-col gap-1">
            <li>Provide, maintain, and improve the Service</li>
            <li>Display your verified profile and MRR publicly (where you have opted in)</li>
            <li>Process subscription payments via Lemon Squeezy</li>
            <li>Send transactional emails (subscription confirmation, billing receipts)</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p className="mt-2">
            We do not sell, rent, or share your personal data with third parties for their own
            marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">
            4. Third-Party Processors
          </h2>
          <p>
            We share data with the following processors who act on our documented instructions:
          </p>
          <ul className="list-disc list-inside mt-2 flex flex-col gap-1">
            <li>
              <strong>Lemon Squeezy</strong> — payment processing and subscription management
              (Merchant of Record). Your billing details are handled under their privacy policy and
              PCI-DSS compliance.
            </li>
            <li>
              <strong>Vercel</strong> — cloud hosting and edge delivery. Server logs may include IP
              addresses.
            </li>
            <li>
              <strong>Analytics provider</strong> — aggregate, anonymised traffic analytics (no
              cross-site tracking).
            </li>
          </ul>
          <p className="mt-2">
            All processors are contractually bound to process data only on our behalf and in
            accordance with applicable data protection law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">
            5. International Transfers
          </h2>
          <p>
            Our processors may store or process data outside the European Economic Area (EEA).
            Where this occurs, we ensure appropriate safeguards are in place — including Standard
            Contractual Clauses (SCCs) approved by the European Commission — so that your data
            receives equivalent protection.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">
            6. Data Retention
          </h2>
          <ul className="list-disc list-inside flex flex-col gap-1">
            <li>
              <strong>Account &amp; profile data</strong> — retained for the duration of your
              account plus 12 months after deletion, unless a longer period is required by law.
            </li>
            <li>
              <strong>Payment records</strong> — retained for 7 years to comply with tax and
              accounting obligations.
            </li>
            <li>
              <strong>Server logs</strong> — retained for up to 90 days.
            </li>
          </ul>
          <p className="mt-2">
            After the applicable retention period, data is securely deleted or irreversibly
            anonymised.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">7. Your Rights</h2>
          <p>
            If you are located in the EEA, UK, or Switzerland, you have the following rights under
            applicable data protection law:
          </p>
          <ul className="list-disc list-inside mt-2 flex flex-col gap-1">
            <li>
              <strong>Access</strong> — request a copy of the personal data we hold about you.
            </li>
            <li>
              <strong>Rectification</strong> — ask us to correct inaccurate or incomplete data.
            </li>
            <li>
              <strong>Erasure (&quot;right to be forgotten&quot;)</strong> — ask us to delete your
              data where there is no legitimate reason for us to continue processing it.
            </li>
            <li>
              <strong>Portability</strong> — receive your data in a structured, machine-readable
              format and transfer it to another controller.
            </li>
            <li>
              <strong>Objection</strong> — object to processing based on legitimate interests or
              for direct marketing purposes.
            </li>
            <li>
              <strong>Restriction</strong> — request that we restrict processing of your data in
              certain circumstances.
            </li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, email{" "}
            <a href="mailto:contact@mrr.fyi" className="text-[var(--amber)] hover:underline">
              contact@mrr.fyi
            </a>{" "}
            with the subject line &quot;Data Rights Request&quot;. We will respond within 30 days.
            You also have the right to lodge a complaint with your local supervisory authority (for
            EEA residents, the relevant Data Protection Authority).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">8. Cookies</h2>
          <p>
            We use essential cookies required for the Service to function (session management,
            authentication). We may use analytics cookies in an anonymised, aggregate manner. You
            can disable non-essential cookies in your browser settings; doing so may affect some
            features of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">
            9. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. Material changes will be
            communicated by posting the revised policy here with an updated date and, where
            required by law, by email. Your continued use of the Service after the effective date
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)] mb-2">10. Contact</h2>
          <p>
            Privacy questions or requests? Email us at{" "}
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
