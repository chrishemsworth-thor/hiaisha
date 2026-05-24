import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Hiaisha',
  description:
    'Learn how Hiaisha collects, uses, and protects your personal data in accordance with Malaysian law.',
  openGraph: {
    title: 'Privacy Policy — Hiaisha',
    description:
      'Learn how Hiaisha collects, uses, and protects your personal data in accordance with Malaysian law.',
    url: 'https://hiaisha.com/privacy',
    siteName: 'Hiaisha',
    type: 'website',
  },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-card border border-gray-200 p-8 prose prose-sm max-w-none">
        <h1 className="font-display font-bold text-2xl text-[#1A1A1A] mb-1">
          Privacy Policy
        </h1>
        <p className="text-muted text-sm mb-8">
          Effective date: 1 June 2025 &nbsp;·&nbsp; Last updated: 1 June 2025
        </p>

        <section className="mb-8">
          <p className="text-[#1A1A1A] leading-relaxed">
            Hiaisha Technologies Sdn. Bhd. (&ldquo;Hiaisha&rdquo;, &ldquo;we&rdquo;,
            &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your personal
            data. This Privacy Policy explains what information we collect when you use{' '}
            <Link href="https://hiaisha.com" className="text-primary hover:underline">
              hiaisha.com
            </Link>{' '}
            (the &ldquo;Platform&rdquo;), how we use it, and your rights with respect to that
            information. This policy is drafted in compliance with the{' '}
            <em>Personal Data Protection Act 2010</em> (PDPA) of Malaysia.
          </p>
        </section>

        {/* ── 1. Data We Collect ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            1. Data We Collect
          </h2>

          <h3 className="font-semibold text-base text-[#1A1A1A] mb-2 mt-4">
            1.1 Data You Provide Directly
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-[#1A1A1A] leading-relaxed">
            <li>
              <strong>Account information:</strong> username, email address, and password hash
              collected at registration.
            </li>
            <li>
              <strong>Profile information:</strong> optional biography and profile avatar you
              choose to add to your public profile.
            </li>
            <li>
              <strong>User Content:</strong> posts (text, images), comments, community names,
              tags, and location data you attach to posts.
            </li>
            <li>
              <strong>Reports &amp; support requests:</strong> information you include when
              you report content or contact us for assistance.
            </li>
          </ul>

          <h3 className="font-semibold text-base text-[#1A1A1A] mb-2 mt-6">
            1.2 Data Collected Automatically
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-[#1A1A1A] leading-relaxed">
            <li>
              <strong>Log data:</strong> IP address, browser type, operating system, referring
              URL, pages visited, and timestamps, collected automatically when you use the
              Platform.
            </li>
            <li>
              <strong>Device information:</strong> device identifiers, screen resolution, and
              language settings.
            </li>
            <li>
              <strong>Usage data:</strong> voting patterns, communities joined, posts viewed,
              and other interactions — used solely for feed ranking and content
              recommendations.
            </li>
          </ul>

          <h3 className="font-semibold text-base text-[#1A1A1A] mb-2 mt-6">
            1.3 Data from Third Parties
          </h3>
          <p className="text-[#1A1A1A] leading-relaxed">
            We do not currently purchase or receive personal data from third-party data
            brokers. If you sign in via a social authentication provider in the future, we
            will update this policy and request only the minimum necessary permissions.
          </p>
        </section>

        {/* ── 2. How We Use Your Data ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            2. How We Use Your Data
          </h2>
          <p className="text-[#1A1A1A] leading-relaxed mb-3">
            We process your personal data only for the purposes listed below, on a lawful
            basis as required by PDPA:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-[#1A1A1A] border-collapse">
              <thead>
                <tr className="bg-[#F5F4F0]">
                  <th className="text-left p-3 border border-gray-200 font-semibold">
                    Purpose
                  </th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">
                    Lawful Basis
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Create and manage your account', 'Contract performance'],
                  ['Deliver the feed, communities, and notifications', 'Contract performance'],
                  ['Personalise content and rankings', 'Legitimate interest'],
                  ['Send transactional emails (password reset, notifications)', 'Contract performance'],
                  ['Detect and prevent abuse, spam, and fraud', 'Legitimate interest / Legal obligation'],
                  ['Comply with legal obligations and MCMC directives', 'Legal obligation'],
                  ['Improve the Platform through analytics', 'Legitimate interest'],
                ].map(([purpose, basis], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF7]'}>
                    <td className="p-3 border border-gray-200">{purpose}</td>
                    <td className="p-3 border border-gray-200">{basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[#1A1A1A] leading-relaxed mt-3">
            We do <strong>not</strong> sell your personal data to advertisers or third parties.
          </p>
        </section>

        {/* ── 3. Data Sharing ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            3. Data Sharing &amp; Disclosure
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-[#1A1A1A] leading-relaxed">
            <li>
              <strong>Service providers:</strong> We share data with trusted sub-processors
              (e.g. email delivery via Resend, cloud infrastructure via Cloudflare) solely to
              provide the Platform. These providers are contractually bound to protect your
              data.
            </li>
            <li>
              <strong>Legal requirements:</strong> We may disclose data to Malaysian
              authorities (including the MCMC and Royal Malaysia Police) when required by
              law, court order, or other governmental directive.
            </li>
            <li>
              <strong>Business transfers:</strong> In the event of a merger, acquisition, or
              sale of assets, user data may be transferred as part of that transaction,
              subject to equivalent privacy protections.
            </li>
            <li>
              <strong>Public content:</strong> Posts and comments you submit are public by
              default and may be indexed by search engines.
            </li>
          </ul>
        </section>

        {/* ── 4. Data Retention ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            4. Data Retention
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-[#1A1A1A] leading-relaxed">
            <li>
              Account and profile data are retained for as long as your account is active, or
              as necessary to provide the Platform.
            </li>
            <li>
              Upon account deletion, we delete or anonymise personal data within{' '}
              <strong>30 days</strong>, except where we are required to retain it by law (e.g.
              logs relating to a pending legal matter).
            </li>
            <li>
              Server log data is retained for up to <strong>90 days</strong> for security and
              abuse-prevention purposes.
            </li>
          </ul>
        </section>

        {/* ── 5. Cookies ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            5. Cookies &amp; Local Storage
          </h2>
          <p className="text-[#1A1A1A] leading-relaxed mb-3">
            We use browser local storage to store your authentication token and UI
            preferences (e.g. dark mode). We do not currently use third-party tracking
            cookies or advertising pixels. If this changes, we will update this policy and
            present a consent notice.
          </p>
        </section>

        {/* ── 6. Security ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            6. Security
          </h2>
          <p className="text-[#1A1A1A] leading-relaxed">
            We implement industry-standard measures to protect your data, including TLS
            encryption in transit, hashed passwords, and access controls. However, no
            transmission over the internet is 100% secure, and we cannot guarantee absolute
            security.
          </p>
        </section>

        {/* ── 7. Your Rights ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            7. Your Rights Under PDPA
          </h2>
          <p className="text-[#1A1A1A] leading-relaxed mb-3">
            Under the Personal Data Protection Act 2010, you have the right to:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#1A1A1A] leading-relaxed">
            <li>
              <strong>Access</strong> the personal data we hold about you.
            </li>
            <li>
              <strong>Correct</strong> any inaccurate or incomplete personal data.
            </li>
            <li>
              <strong>Withdraw consent</strong> to processing based on consent (where
              applicable), without affecting the lawfulness of prior processing.
            </li>
            <li>
              <strong>Limit processing</strong> in certain circumstances (e.g. while accuracy
              is disputed).
            </li>
            <li>
              <strong>Request deletion</strong> of your account and associated personal data,
              subject to legal retention obligations.
            </li>
          </ul>
          <p className="text-[#1A1A1A] leading-relaxed mt-4">
            To exercise any of these rights, email us at{' '}
            <a href="mailto:privacy@hiaisha.com" className="text-primary hover:underline">
              privacy@hiaisha.com
            </a>{' '}
            with the subject line <em>&ldquo;Data Request — [Your Username]&rdquo;</em>. We
            will respond within <strong>21 days</strong> as required by PDPA.
          </p>
        </section>

        {/* ── 8. Children ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            8. Children&rsquo;s Privacy
          </h2>
          <p className="text-[#1A1A1A] leading-relaxed">
            Hiaisha is not directed to children under the age of 13. We do not knowingly
            collect personal data from children under 13. If you believe a child under 13 has
            provided us with personal data, please contact us at{' '}
            <a href="mailto:privacy@hiaisha.com" className="text-primary hover:underline">
              privacy@hiaisha.com
            </a>{' '}
            and we will delete the relevant data promptly.
          </p>
        </section>

        {/* ── 9. Changes ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            9. Changes to This Policy
          </h2>
          <p className="text-[#1A1A1A] leading-relaxed">
            We may update this Privacy Policy periodically. We will notify you of material
            changes via email or an in-app notice, and update the &ldquo;Last updated&rdquo;
            date above. Continued use of the Platform after changes become effective
            constitutes acceptance of the revised policy.
          </p>
        </section>

        {/* ── Contact ── */}
        <section className="mb-2">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            10. Contact &amp; Data Requests
          </h2>
          <p className="text-[#1A1A1A] leading-relaxed mb-2">
            For all privacy-related enquiries, data access requests, or complaints:
          </p>
          <address className="not-italic text-[#1A1A1A] leading-relaxed">
            <strong>Hiaisha Technologies Sdn. Bhd.</strong>
            <br />
            Email:{' '}
            <a href="mailto:privacy@hiaisha.com" className="text-primary hover:underline">
              privacy@hiaisha.com
            </a>
            <br />
            Kuala Lumpur, Malaysia
          </address>
          <p className="text-[#1A1A1A] leading-relaxed mt-3">
            If you are not satisfied with our response, you may lodge a complaint with the{' '}
            <strong>Department of Personal Data Protection Malaysia</strong> (
            <a
              href="https://www.pdp.gov.my"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              pdp.gov.my
            </a>
            ).
          </p>
        </section>

        <hr className="my-8 border-gray-200" />
        <p className="text-xs text-muted text-center">
          &copy; {new Date().getFullYear()} Hiaisha Technologies Sdn. Bhd. All rights reserved.
          &nbsp;·&nbsp;
          <Link href="/terms" className="hover:text-primary">
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  );
}
