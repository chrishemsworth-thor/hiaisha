import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Hiaisha',
  description:
    'Read the Terms of Service for Hiaisha, the Malaysian food community platform.',
  openGraph: {
    title: 'Terms of Service — Hiaisha',
    description:
      'Read the Terms of Service for Hiaisha, the Malaysian food community platform.',
    url: 'https://hiaisha.com/terms',
    siteName: 'Hiaisha',
    type: 'website',
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-card border border-gray-200 p-8 prose prose-sm max-w-none">
        <h1 className="font-display font-bold text-2xl text-[#1A1A1A] mb-1">
          Terms of Service
        </h1>
        <p className="text-muted text-sm mb-8">
          Effective date: 1 June 2025 &nbsp;·&nbsp; Last updated: 1 June 2025
        </p>

        <section className="mb-8">
          <p className="text-[#1A1A1A] leading-relaxed">
            Welcome to <strong>Hiaisha</strong> (&ldquo;the Platform&rdquo;), operated by Hiaisha
            Technologies Sdn. Bhd., a company incorporated in Malaysia
            (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). By accessing or using
            Hiaisha at{' '}
            <Link href="https://hiaisha.com" className="text-primary hover:underline">
              hiaisha.com
            </Link>{' '}
            you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not
            agree, please stop using the Platform immediately.
          </p>
        </section>

        {/* ── 1. Eligibility ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            1. Eligibility
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-[#1A1A1A] leading-relaxed">
            <li>
              You must be at least <strong>13 years old</strong> to create an account. If you
              are between 13 and 18, you represent that a parent or guardian has consented to
              these Terms on your behalf.
            </li>
            <li>
              You must be capable of forming a binding contract under Malaysian law.
            </li>
            <li>
              Accounts may not be created by or for persons previously suspended or banned
              from the Platform.
            </li>
          </ul>
        </section>

        {/* ── 2. Your Account ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            2. Your Account
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-[#1A1A1A] leading-relaxed">
            <li>
              You are responsible for maintaining the confidentiality of your login credentials
              and for all activity that occurs under your account.
            </li>
            <li>
              You must provide accurate and complete registration information, including a
              valid email address.
            </li>
            <li>
              You may not transfer or sell your account to another person.
            </li>
            <li>
              Notify us immediately at{' '}
              <a href="mailto:support@hiaisha.com" className="text-primary hover:underline">
                support@hiaisha.com
              </a>{' '}
              if you suspect unauthorised access to your account.
            </li>
          </ul>
        </section>

        {/* ── 3. User Conduct ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            3. User Conduct
          </h2>
          <p className="text-[#1A1A1A] leading-relaxed mb-3">
            You agree <strong>not</strong> to post, upload, share, or otherwise make available
            content or engage in behaviour that:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#1A1A1A] leading-relaxed">
            <li>
              Is unlawful, harmful, threatening, abusive, harassing, defamatory, or
              discriminatory under Malaysian law or any applicable law.
            </li>
            <li>
              Incites hatred against any individual or group on the basis of race, religion,
              gender, national origin, disability, or sexual orientation — including content
              that may constitute a seditious publication under the{' '}
              <em>Sedition Act 1948</em>.
            </li>
            <li>
              Violates the <em>Communications and Multimedia Act 1998</em> (CMA), including
              but not limited to Section 211 and Section 233 regarding indecent, obscene,
              false, menacing, or offensive content transmitted over a communications network.
            </li>
            <li>
              Infringes any third party&rsquo;s intellectual property rights, including
              copyright under the <em>Copyright Act 1987</em>.
            </li>
            <li>
              Contains spam, malware, phishing links, or any other malicious or disruptive
              content.
            </li>
            <li>
              Constitutes impersonation of any person or entity, or misrepresents your
              affiliation with a person or entity.
            </li>
            <li>
              Involves solicitation of personal or financial information from minors.
            </li>
            <li>
              Uses automated means (bots, scrapers, crawlers) to access the Platform without
              our prior written consent.
            </li>
          </ul>
        </section>

        {/* ── 4. Content Ownership & Licence ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            4. Content Ownership &amp; Licence
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-[#1A1A1A] leading-relaxed">
            <li>
              <strong>You own your content.</strong> Text, images, and other materials you
              submit (&ldquo;User Content&rdquo;) remain your intellectual property.
            </li>
            <li>
              By submitting User Content you grant Hiaisha a worldwide, non-exclusive,
              royalty-free, sub-licensable licence to use, reproduce, display, distribute,
              and adapt that content solely for the purposes of operating and improving the
              Platform.
            </li>
            <li>
              You represent and warrant that you hold all necessary rights to grant the above
              licence and that your User Content does not infringe any third-party rights.
            </li>
            <li>
              We reserve the right to remove any User Content that violates these Terms,
              without prior notice.
            </li>
          </ul>
        </section>

        {/* ── 5. MCMC Compliance & Reporting ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            5. MCMC Compliance &amp; Content Reporting
          </h2>
          <p className="text-[#1A1A1A] leading-relaxed mb-3">
            Hiaisha operates in compliance with Malaysian law, including directives from the
            Malaysian Communications and Multimedia Commission (MCMC) under the{' '}
            <em>Communications and Multimedia Act 1998</em>.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#1A1A1A] leading-relaxed">
            <li>
              We may be required to disclose user information to Malaysian authorities pursuant
              to lawful orders or directives issued under applicable legislation.
            </li>
            <li>
              If you encounter content that you believe violates these Terms or applicable
              Malaysian law, please use the <strong>Report</strong> button available on every
              post and comment, or email us at{' '}
              <a href="mailto:report@hiaisha.com" className="text-primary hover:underline">
                report@hiaisha.com
              </a>
              .
            </li>
            <li>
              We aim to review all reports within <strong>72 hours</strong> of receipt and
              will take appropriate action, which may include content removal or account
              suspension.
            </li>
            <li>
              False or malicious reports submitted to harass other users may result in
              enforcement action against the reporting party.
            </li>
          </ul>
        </section>

        {/* ── 6. Moderation ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            6. Moderation &amp; Enforcement
          </h2>
          <p className="text-[#1A1A1A] leading-relaxed">
            We reserve the right, in our sole discretion, to remove content, warn users,
            suspend or permanently ban accounts, and restrict access to the Platform for
            violations of these Terms. Moderation decisions are final, though you may appeal
            to{' '}
            <a href="mailto:appeals@hiaisha.com" className="text-primary hover:underline">
              appeals@hiaisha.com
            </a>{' '}
            within 14 days of the action.
          </p>
        </section>

        {/* ── 7. Disclaimers ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            7. Disclaimers
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-[#1A1A1A] leading-relaxed">
            <li>
              The Platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
              basis without warranties of any kind, express or implied.
            </li>
            <li>
              We do not endorse or take responsibility for the accuracy or reliability of any
              User Content, including restaurant reviews, food images, or location information.
            </li>
            <li>
              Food hygiene or safety information posted by users is not a substitute for
              official regulatory guidance.
            </li>
          </ul>
        </section>

        {/* ── 8. Limitation of Liability ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            8. Limitation of Liability
          </h2>
          <p className="text-[#1A1A1A] leading-relaxed">
            To the fullest extent permitted by Malaysian law, Hiaisha Technologies Sdn. Bhd.
            and its officers, employees, and agents shall not be liable for any indirect,
            incidental, special, or consequential damages arising from your use of the
            Platform, including loss of data or goodwill.
          </p>
        </section>

        {/* ── 9. Governing Law ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            9. Governing Law &amp; Dispute Resolution
          </h2>
          <p className="text-[#1A1A1A] leading-relaxed">
            These Terms are governed by the laws of Malaysia. Any dispute arising from or
            relating to these Terms shall first be attempted to be resolved through good-faith
            negotiation. If unresolved after 30 days, disputes shall be submitted to the
            exclusive jurisdiction of the courts of Kuala Lumpur, Malaysia.
          </p>
        </section>

        {/* ── 10. Changes ── */}
        <section className="mb-8">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            10. Changes to These Terms
          </h2>
          <p className="text-[#1A1A1A] leading-relaxed">
            We may update these Terms from time to time. When we do, we will revise the
            &ldquo;Last updated&rdquo; date at the top. Continued use of the Platform after
            changes are posted constitutes your acceptance of the revised Terms. For material
            changes, we will provide notice via email or an in-app announcement.
          </p>
        </section>

        {/* ── Contact ── */}
        <section className="mb-2">
          <h2 className="font-display font-semibold text-lg text-[#1A1A1A] mb-3">
            11. Contact Us
          </h2>
          <p className="text-[#1A1A1A] leading-relaxed">
            For any questions about these Terms, please contact us:
          </p>
          <address className="not-italic mt-2 text-[#1A1A1A] leading-relaxed">
            <strong>Hiaisha Technologies Sdn. Bhd.</strong>
            <br />
            Email:{' '}
            <a href="mailto:legal@hiaisha.com" className="text-primary hover:underline">
              legal@hiaisha.com
            </a>
            <br />
            Kuala Lumpur, Malaysia
          </address>
        </section>

        <hr className="my-8 border-gray-200" />
        <p className="text-xs text-muted text-center">
          &copy; {new Date().getFullYear()} Hiaisha Technologies Sdn. Bhd. All rights reserved.
          &nbsp;·&nbsp;
          <Link href="/privacy" className="hover:text-primary">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
