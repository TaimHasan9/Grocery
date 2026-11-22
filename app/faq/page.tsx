import React from 'react';
import Link from 'next/link';

const FAQS = [
  {
    q: 'How does Gromuse deliver groceries within 15 minutes?',
    a: 'We operate neighborhood cold-chain micro-hubs stocked each morning with organic produce, dairy, bakery loaves, meat, and pantry essentials so couriers dispatch minutes after checkout.',
  },
  {
    q: 'What is the free delivery threshold?',
    a: 'Orders of $50.00 or more (after coupon discounts) automatically qualify for Free Express Delivery. Orders under $50.00 carry a flat $3.99 delivery fee.',
  },
  {
    q: 'Which promo coupons are active right now?',
    a: 'You can apply FRESH15 (15% off orders $20+), GROMUSE10 (10% off $10+), SAVE5 ($5 off $30+), or HEALTH5 (5% off any basket) inside your Cart or Checkout.',
  },
  {
    q: 'Can I pay with Cash on Delivery?',
    a: 'Yes! Select Cash on Delivery at checkout to pay upon courier arrival, or configure Stripe credentials on the server for online card checkout.',
  },
  {
    q: 'How do I track an order placed as a guest?',
    a: 'Visit the Orders & Tracking page and enter your Gromuse Order Number along with the email used at checkout to view real-time preparation and delivery stages.',
  },
];

export default function FaqPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 pt-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[#14221C]">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-[#607067] mt-1">
          Everything you need to know about Gromuse delivery, freshness guarantees, and payments.
        </p>
      </div>

      <div className="space-y-4">
        {FAQS.map((item) => (
          <div
            key={item.q}
            className="bg-white rounded-3xl border border-[#EAECE9] p-6 space-y-2"
          >
            <h2 className="text-base font-bold text-[#14221C]">{item.q}</h2>
            <p className="text-sm text-[#4A5A52] leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#EDF5E1] rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-semibold text-[#14221C]">
          Still have questions? Our support team is ready to assist.
        </p>
        <Link
          href="/contact"
          className="px-6 py-2.5 rounded-full bg-[#114B3C] text-white text-xs font-bold"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
