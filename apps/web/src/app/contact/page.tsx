'use client';

import { PublicLayout } from '@/components/layout/PublicLayout';
import { Mail, Phone, MapPin, Clock, MessageCircle, Headphones, FileText, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const CONTACT_METHODS = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Send us a detailed message and we\'ll respond within 2 hours on business days.',
    value: 'support@yantrix.in',
    href: 'mailto:support@yantrix.in',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Talk to a real person. Available Monday to Saturday, 9 AM – 6 PM IST.',
    value: '+91 80 4567 8900',
    href: 'tel:+918045678900',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: MessageCircle,
    title: 'Live Chat',
    description: 'Chat with our team directly in the app. Average response time under 5 minutes.',
    value: 'Available in-app',
    href: '/auth/login',
    color: 'bg-purple-50 text-purple-600',
  },
];

const FAQS = [
  {
    question: 'How do I get started with Yantrix?',
    answer: 'Sign up for a free account at yantrix.in/auth/register. Add your business GSTIN, and you can start creating invoices immediately. No credit card required.',
  },
  {
    question: 'Can I import my existing data?',
    answer: 'Yes. You can import customers and products via CSV. For invoice history, contact our support team and we\'ll help you migrate your data.',
  },
  {
    question: 'Is Yantrix GST compliant?',
    answer: 'Absolutely. Yantrix is fully compliant with the CGST Act, SGST Act, and IGST Act. Our invoices meet all requirements including e-invoicing for applicable businesses.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit/debit cards, UPI, net banking, and wallets through our payment partner Razorpay.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes. You can cancel your subscription from Settings > Billing. Your plan remains active until the end of the billing period.',
  },
  {
    question: 'Do you offer a free trial?',
    answer: 'Yes. Our Free plan is available with no time limit. Paid plans come with a 14-day money-back guarantee.',
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would POST to an API endpoint
    setSubmitted(true);
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
            Contact Us
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Have a question, facing an issue, or want to see a feature?
            Our team responds to every message — usually within 2 hours.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16">
        <div className="container-wide">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {CONTACT_METHODS.map(method => (
              <a
                key={method.title}
                href={method.href}
                className="group bg-white rounded-2xl border border-gray-100 p-6 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 text-left"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${method.color} mb-4`}>
                  <method.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{method.title}</h3>
                <p className="text-sm text-gray-500 mb-3 leading-relaxed">{method.description}</p>
                <span className="text-sm font-medium text-indigo-600 group-hover:underline">{method.value}</span>
              </a>
            ))}
          </div>

          {/* Contact Form + Office Info */}
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>

                {submitted ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Message sent!</h3>
                    <p className="text-gray-600">
                      Thanks for reaching out. We&apos;ll get back to you at <strong>{formData.email}</strong> within 2 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                          placeholder="Rajesh Kumar"
                          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                          placeholder="rajesh@business.com"
                          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                      <select
                        value={formData.subject}
                        onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition bg-white"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                      <textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                        placeholder="Describe your question or issue in detail..."
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                    >
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Office Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-600" />
                  Our Office
                </h3>
                <address className="not-italic text-sm text-gray-600 space-y-1">
                  <p className="font-medium text-gray-900">Yantrix Technologies Pvt. Ltd.</p>
                  <p>4th Floor, Innovate Hub</p>
                  <p>80 Feet Road, Koramangala</p>
                  <p>Bengaluru, Karnataka 560034</p>
                  <p>India</p>
                </address>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  Support Hours
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Monday – Friday</span>
                    <span className="font-medium text-gray-900">9 AM – 8 PM IST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span className="font-medium text-gray-900">10 AM – 6 PM IST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="font-medium text-gray-500">Email only</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Extended support hours available during GST filing deadlines (20th – 22nd of each month).</p>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6">
                <FileText className="h-6 w-6 text-indigo-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Looking for help docs?</h3>
                <p className="text-sm text-gray-600 mb-4">Browse our knowledge base for step-by-step guides and video tutorials.</p>
                <a href="#" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
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
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 text-sm">{faq.question}</span>
                  <ChevronRight className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${openFaq === idx ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === idx && (
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
