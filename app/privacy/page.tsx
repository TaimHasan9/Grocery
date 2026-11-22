import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 pt-8 space-y-6">
      <h1 className="text-3xl font-extrabold text-[#14221C]">Privacy Policy</h1>
      <div className="bg-white rounded-3xl border border-[#EAECE9] p-8 space-y-4 text-sm text-[#4A5A52] leading-relaxed">
        <p>
          Gromuse respects your privacy and collects only the information necessary to fulfill your grocery orders, remember your saved addresses, and provide live delivery tracking.
        </p>
        <p>
          Authentication is handled securely via Firebase Authentication, and all payment card processing (when enabled) runs through PCI-compliant Stripe Checkout sessions with server-side webhook verification. Gromuse never stores raw card numbers in our database.
        </p>
        <p>
          You may update or remove saved delivery addresses anytime from your Customer Account page.
        </p>
      </div>
    </div>
  );
}
