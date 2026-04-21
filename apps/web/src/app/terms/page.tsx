import { PublicLayout } from '@/components/layout/PublicLayout';
import { FileText, Scale } from 'lucide-react';

export default function TermsPage() {
  const lastUpdated = 'January 15, 2025';

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container-wide max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-6">
            <Scale className="h-3.5 w-3.5" />
            Legal
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-500 text-sm">Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container-wide max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12 space-y-10">

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <strong>Important:</strong> Please read these Terms of Service carefully before using Yantrix.
              By accessing or using our platform, you agree to be bound by these terms.
            </div>

            <Section title="1. Acceptance of Terms">
              <p>
                By creating an account or using any part of the Yantrix platform (&quot;Service&quot;), you agree to
                these Terms of Service (&quot;Terms&quot;) and our Privacy Policy. If you do not agree, please do not
                use the Service.
              </p>
              <p>
                These Terms apply to all users, including business owners, team members, and any other
                persons who access the Service.
              </p>
            </Section>

            <Section title="2. Description of Service">
              <p>
                Yantrix provides a cloud-based GST invoicing and business management platform for Indian
                businesses. The Service includes tools for creating and managing invoices, tracking payments,
                managing customers and products, and generating GST reports.
              </p>
            </Section>

            <Section title="3. Account Registration">
              <ul>
                <li>You must provide accurate, complete, and current information when creating an account.</li>
                <li>You are responsible for maintaining the security of your account credentials.</li>
                <li>You must notify us immediately if you suspect unauthorized access to your account.</li>
                <li>One person may not maintain multiple free accounts. Organizations may have multiple users under one subscription.</li>
              </ul>
            </Section>

            <Section title="4. Acceptable Use">
              <p>You agree not to:</p>
              <ul>
                <li>Use the Service to generate fraudulent or misleading invoices</li>
                <li>Violate any applicable Indian tax laws, including the CGST Act, SGST Act, or IGST Act</li>
                <li>Upload malicious code, viruses, or any harmful content</li>
                <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
                <li>Reverse-engineer, copy, or reproduce any part of the Service</li>
                <li>Use the Service for any unlawful purpose</li>
              </ul>
            </Section>

            <Section title="5. Subscription and Payments">
              <p>
                Yantrix offers free and paid subscription plans. Paid plans are billed monthly or annually
                as selected at the time of purchase.
              </p>
              <ul>
                <li>All prices are in Indian Rupees (INR) and inclusive of applicable GST</li>
                <li>Subscriptions do not auto-renew; you must manually renew your plan before the expiry date to continue using premium features</li>
                <li>You may cancel your subscription at any time; cancellation takes effect at the end of the billing period</li>
                <li>We reserve the right to change pricing with 30 days notice</li>
              </ul>
            </Section>

            <Section title="6. Refund Policy">
              <p>
                We offer a 14-day money-back guarantee for new paid subscribers. If you are not satisfied
                with the Service within 14 days of your first paid subscription, contact our support team
                for a full refund.
              </p>
              <p>
                After 14 days, refunds are handled on a case-by-case basis at our discretion. Refunds are
                not provided for partial months of service.
              </p>
            </Section>

            <Section title="7. Data Ownership">
              <p>
                You own all business data you input into Yantrix — including invoices, customer records,
                and product details. We do not claim ownership over your data.
              </p>
              <p>
                You may export your data at any time from the Settings section. Upon account deletion,
                we will retain your data for 90 days before permanent deletion.
              </p>
            </Section>

            <Section title="8. Intellectual Property">
              <p>
                All software, designs, trademarks, and content comprising the Yantrix platform are the
                exclusive property of Yantrix Technologies Pvt. Ltd. You are granted a limited, non-exclusive,
                non-transferable license to use the Service for your business purposes.
              </p>
            </Section>

            <Section title="9. Disclaimer of Warranties">
              <p>
                The Service is provided &quot;as is&quot; without warranty of any kind. Yantrix does not warrant that
                the Service will be uninterrupted or error-free. We do not provide legal or tax advice;
                you are responsible for verifying your tax filings with a qualified professional.
              </p>
            </Section>

            <Section title="10. Limitation of Liability">
              <p>
                To the maximum extent permitted by law, Yantrix&apos;s total liability to you for any claims
                arising out of or related to these Terms or the Service shall not exceed the amount you
                paid to Yantrix in the 12 months preceding the claim.
              </p>
            </Section>

            <Section title="11. Governing Law">
              <p>
                These Terms are governed by the laws of India. Any disputes arising shall be subject to
                the exclusive jurisdiction of courts in Bengaluru, Karnataka, India.
              </p>
            </Section>

            <Section title="12. Changes to Terms">
              <p>
                We may update these Terms from time to time. We will notify you via email or an in-app
                notice at least 14 days before material changes take effect. Continued use of the Service
                after changes constitutes acceptance.
              </p>
            </Section>

            <Section title="13. Contact">
              <p>
                For questions about these Terms, please contact us at{' '}
                <a href="mailto:legal@yantrix.in" className="text-indigo-600 hover:underline">legal@yantrix.in</a>
                {' '}or visit our{' '}
                <a href="/contact" className="text-indigo-600 hover:underline">Contact page</a>.
              </p>
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
