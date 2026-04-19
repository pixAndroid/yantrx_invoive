import { PublicLayout } from '@/components/layout/PublicLayout';
import { Shield, Lock } from 'lucide-react';

export default function PrivacyPage() {
  const lastUpdated = 'January 15, 2025';

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container-wide max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-6">
            <Shield className="h-3.5 w-3.5" />
            Legal
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container-wide max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12 space-y-10">

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-800">
              <strong>Your privacy matters to us.</strong> This policy explains what data we collect,
              how we use it, and what controls you have over it.
            </div>

            <Section title="1. Who We Are">
              <p>
                Yantrix Technologies Pvt. Ltd. (&quot;Yantrix&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the Yantrix
                platform at yantrix.in. This Privacy Policy describes how we collect, use, and share
                information about you when you use our platform.
              </p>
            </Section>

            <Section title="2. Information We Collect">
              <p><strong>Account Information:</strong> When you register, we collect your name, email address, phone number, and business details including GSTIN.</p>
              <p><strong>Business Data:</strong> Invoice details, customer records, product information, payment records, and other data you input into the platform.</p>
              <p><strong>Usage Data:</strong> Log files, IP addresses, browser type, pages visited, and features used — to improve our service.</p>
              <p><strong>Payment Information:</strong> Billing details processed securely through our payment partner (Razorpay). We do not store full card numbers.</p>
              <p><strong>Communications:</strong> If you contact our support team, we retain those communications to improve our service.</p>
            </Section>

            <Section title="3. How We Use Your Information">
              <ul>
                <li>To provide, maintain, and improve the Yantrix platform</li>
                <li>To process payments and manage your subscription</li>
                <li>To send transactional emails (invoice confirmations, payment receipts)</li>
                <li>To send product updates and feature announcements (you can opt out)</li>
                <li>To provide customer support</li>
                <li>To detect and prevent fraud or abuse</li>
                <li>To comply with legal obligations under Indian law</li>
              </ul>
            </Section>

            <Section title="4. Data Sharing">
              <p>We do not sell your personal data. We share data only in these circumstances:</p>
              <ul>
                <li><strong>Service Providers:</strong> Trusted third parties who help us operate the platform (hosting, email, payments). They are contractually bound to protect your data.</li>
                <li><strong>Legal Requirements:</strong> If required by law, court order, or government authority in India.</li>
                <li><strong>Business Transfer:</strong> In the event of a merger or acquisition, with appropriate notification to you.</li>
              </ul>
            </Section>

            <Section title="5. Data Storage and Security">
              <p>
                Your data is stored on servers located in India. We use industry-standard security measures
                including 256-bit SSL encryption, regular security audits, and access controls.
              </p>
              <p>
                While we take reasonable precautions, no internet transmission is 100% secure. We encourage
                you to use a strong, unique password and enable two-factor authentication.
              </p>
            </Section>

            <Section title="6. Data Retention">
              <p>
                We retain your data as long as your account is active. If you delete your account,
                we will permanently delete your data within 90 days, except where we are required to
                retain it for legal or compliance purposes.
              </p>
              <p>
                Invoice data may be retained for up to 7 years to comply with GST record-keeping requirements
                under the CGST Act, 2017.
              </p>
            </Section>

            <Section title="7. Your Rights">
              <p>As a user of Yantrix, you have the right to:</p>
              <ul>
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                <li><strong>Export:</strong> Download your business data in CSV or PDF format from Settings</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing emails at any time</li>
              </ul>
              <p>To exercise these rights, contact <a href="mailto:privacy@yantrix.in" className="text-indigo-600 hover:underline">privacy@yantrix.in</a>.</p>
            </Section>

            <Section title="8. Cookies">
              <p>
                We use cookies and similar technologies to maintain your session, remember your preferences,
                and analyze usage patterns. You can control cookie settings through your browser.
              </p>
              <p>
                We do not use cookies for cross-site advertising or sell cookie data to third parties.
              </p>
            </Section>

            <Section title="9. Children's Privacy">
              <p>
                Yantrix is intended for use by businesses and is not directed at individuals under 18 years
                of age. We do not knowingly collect personal data from minors.
              </p>
            </Section>

            <Section title="10. Changes to This Policy">
              <p>
                We may update this Privacy Policy periodically. We will notify you via email or in-app
                notification when significant changes are made. Continued use of the Service constitutes
                acceptance of the updated policy.
              </p>
            </Section>

            <Section title="11. Contact">
              <p>
                For privacy-related queries, contact our Data Protection Officer at{' '}
                <a href="mailto:privacy@yantrix.in" className="text-indigo-600 hover:underline">privacy@yantrix.in</a>
                {' '}or write to us at:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <p className="font-medium text-gray-900">Yantrix Technologies Pvt. Ltd.</p>
                <p>Attn: Data Protection Officer</p>
                <p>Koramangala, Bengaluru - 560034</p>
                <p>Karnataka, India</p>
              </div>
            </Section>

          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="text-gray-600 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2">
        {children}
      </div>
    </div>
  );
}
