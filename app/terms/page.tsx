import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 pt-8 space-y-6">
      <h1 className="text-3xl font-extrabold text-[#14221C]">
        Terms &amp; Conditions
      </h1>
      <div className="bg-white rounded-3xl border border-[#EAECE9] p-8 space-y-4 text-sm text-[#4A5A52] leading-relaxed">
        <p>
          By placing an order through Gromuse, you confirm that delivery contact information and street addresses provided at checkout are accurate for 15-minute local courier dispatch.
        </p>
        <p>
          All product prices, promotional coupon discounts, and delivery fees are calculated and verified on our server at order submission time. Promotional coupons are subject to minimum basket thresholds and active validity windows.
        </p>
        <p>
          Perishable produce, dairy, meat, and seafood items are covered by our 100% Freshness Guarantee—reach out through our Help Center if any item arrives damaged.
        </p>
      </div>
    </div>
  );
}
