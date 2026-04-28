'use client';

import { PublicLayout } from '@/components/layout/PublicLayout';
import { Mail, Phone, Clock, Headphones, FileText, ChevronRight, CheckCircle2, Building2, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

const CONTACT_DEFAULTS = {
  contactEmail: 'support@yantrix.in',
  contactPhone: '+91 80 4567 8900',
  contactPhoneHref: 'tel:+918045678900',
  officeCompanyName: 'Yantrix Technologies Pvt. Ltd.',
  officeFloor: '4th Floor, Innovate Hub',
  officeStreet: '80 Feet Road, Koramangala',
  officeCity: 'Bengaluru',
  officeState: 'Karnataka 560034',
  officePinCode: '',
  officeCountry: 'India',
  officeWebsite: 'yantrix.in',
  hoursMondayFriday: '9 AM – 8 PM IST',
  hoursSaturday: '10 AM – 6 PM IST',
  hoursSunday: 'Email only',
  hoursNote: 'Extended support hours during GST filing deadlines (20th – 22nd of each month).',
};

const DEFAULT_FAQS = [
  {
    id: 'default-1',
    question: 'How do I get started with Yantrix?',
    answer: 'Sign up for a free account at yantrix.in/auth/register. Add your business GSTIN, and you can start creating invoices immediately. No credit card required.',
  },
  {
    id: 'default-2',
    question: 'Can I import my existing data?',
    answer: 'Yes. You can import customers and products via CSV. For invoice history, contact our support team and we\'ll help you migrate your data.',
  },
  {
    id: 'default-3',
    question: 'Is Yantrix GST compliant?',
    answer: 'Absolutely. Yantrix is fully compliant with the CGST Act, SGST Act, and IGST Act. Our invoices meet all requirements including e-invoicing for applicable businesses.',
  },
  {
    id: 'default-4',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit/debit cards, UPI, net banking, and wallets through our payment partner Razorpay.',
  },
  {
    id: 'default-5',
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes. You can cancel your subscription from Settings > Billing. Your plan remains active until the end of the billing period.',
  },
  {
    id: 'default-6',
    question: 'Do you offer a free trial?',
    answer: 'Yes. Our Free plan is available with no time limit. Paid plans come with a 14-day money-back guarantee.',
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [contact, setContact] = useState(CONTACT_DEFAULTS);
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);

  useEffect(() => {
    fetch(`${API_URL}/settings/contact-details`)
      .then(r => r.json())
      .then((res: any) => {
        if (res.success && res.data) {
          setContact(prev => ({
            ...prev,
            ...Object.fromEntries(Object.entries(res.data).filter(([, v]) => v != null && v !== '')),
          }));
        }
      })
      .catch(() => {});

    fetch(`${API_URL}/faqs/public`)
      .then(r => r.json())
      .then((res: any) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setFaqs(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          subject: formData.subject || undefined,
          message: formData.message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container-wide text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-6">
            <Headphones className="h-3.5 w-3.5" />
            We&apos;re here to help
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Have a question, facing an issue, or want to explore features?
            Our team responds to every message — usually within 2 hours.
          </p>
        </div>
      </section>

      {/* Contact Form + Business Info */}
      <section className="py-16 bg-white">
        <div className="container-wide">
          <div className="grid lg:grid-cols-5 gap-10 items-start">
            {/* Form — LEFT */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-8 lg:p-10">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a message</h2>
                  <p className="text-sm text-gray-500">Fill in the form and our team will respond within 2 business hours.</p>
                </div>

                {submitted ? (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center mx-auto mb-5">
                      <CheckCircle2 className="h-10 w-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Message sent!</h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">
                      Thanks for reaching out. We&apos;ll get back to you at{' '}
                      <strong className="text-gray-700">{formData.email}</strong> within 2 hours.
                    </p>
                    <button
                      onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                      className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                          placeholder="Rajesh Kumar"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address <span className="text-red-400">*</span></label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                          placeholder="rajesh@business.com"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <Phone className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                          placeholder="+91 98765 43210"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 py-3 text-sm focus:bg-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
                      <select
                        value={formData.subject}
                        onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                      >
                        <option value="">Select a topic</option>
                        <option value="billing">Billing / Subscription</option>
                        <option value="technical">Technical Issue</option>
                        <option value="gst">GST / Tax Question</option>
                        <option value="feature">Feature Request</option>
                        <option value="sales">Sales / Enterprise</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message <span className="text-red-400">*</span></label>
                      <textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                        placeholder="Describe your question or issue in detail..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition resize-none"
                      />
                    </div>

                    {submitError && (
                      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                        {submitError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3.5 text-sm font-bold text-white hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Sending…' : 'Send Message →'}
                    </button>
                    <p className="text-xs text-gray-400 text-center">We&apos;ll never share your information with third parties.</p>
                  </form>
                )}
              </div>
            </div>

            {/* Business Info — RIGHT */}
            <div className="lg:col-span-2 order-1 lg:order-2 space-y-5">
              {/* Office */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-7 text-white shadow-xl shadow-indigo-200">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">Our Office</h3>
                </div>
                <address className="not-italic text-sm leading-relaxed space-y-1 text-indigo-100">
                  <p className="font-bold text-white text-base">{contact.officeCompanyName}</p>
                  {contact.officeFloor && <p>{contact.officeFloor}</p>}
                  {contact.officeStreet && <p>{contact.officeStreet}</p>}
                  {contact.officeCity && <p>{contact.officeCity}{contact.officeState ? `, ${contact.officeState}` : ''}</p>}
                  {contact.officeCountry && <p>{contact.officeCountry}</p>}
                </address>
                <div className="mt-5 pt-5 border-t border-white/20 flex items-center gap-2 text-sm text-indigo-200">
                  <Globe className="h-4 w-4 flex-shrink-0" />
                  <a href={`https://${contact.officeWebsite}`} className="hover:text-white transition-colors">{contact.officeWebsite}</a>
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">Contact Us</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <a href={`mailto:${contact.contactEmail}`} className="flex items-center gap-3 text-gray-700 hover:text-indigo-600 transition-colors">
                    <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>{contact.contactEmail}</span>
                  </a>
                  <a href={contact.contactPhoneHref} className="flex items-center gap-3 text-gray-700 hover:text-indigo-600 transition-colors">
                    <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>{contact.contactPhone}</span>
                  </a>
                </div>
              </div>

              {/* Support Hours */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">Support Hours</h3>
                </div>
                <div className="space-y-3 text-sm">
                  {[
                    { day: 'Monday – Friday', hours: contact.hoursMondayFriday, highlight: true },
                    { day: 'Saturday', hours: contact.hoursSaturday, highlight: false },
                    { day: 'Sunday', hours: contact.hoursSunday, highlight: false },
                  ].map(row => (
                    <div key={row.day} className="flex items-center justify-between">
                      <span className="text-gray-500">{row.day}</span>
                      <span className={`font-semibold px-2.5 py-0.5 rounded-full text-xs ${row.highlight ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'}`}>
                        {row.hours}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 leading-relaxed">{contact.hoursNote}</p>
                </div>
              </div>

              {/* Help Docs */}
              <div className="bg-indigo-50 rounded-3xl border border-indigo-100 p-7">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">Looking for help docs?</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">Browse our knowledge base for step-by-step guides and video tutorials.</p>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 hover:bg-indigo-700 transition-colors"
                >
                  Visit Help Center <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="container-wide max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Quick answers to common questions. Can&apos;t find what you need? Use the form above.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 text-sm">{faq.question}</span>
                  <ChevronRight className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${openFaq === faq.id ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === faq.id && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
