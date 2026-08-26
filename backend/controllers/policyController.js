// Static policy content served from the API so it's centrally maintained
// rather than duplicated/hardcoded in the frontend.
const policies = {
  insurance: {
    title: 'Insurance Policy',
    updatedAt: '2026-08-01',
    body: [
      'Every car listed on RP Car Showroom includes its current insurance status — type (comprehensive, third-party, or none), provider, and validity date — visible on the car detail page.',
      'Buyers can request help with insurance transfer or a new policy when booking a test ride, by checking "I need help with insurance" and adding any notes. Our team will follow up by email.',
      'Insurance transferability varies by state and provider. RP Car Showroom facilitates introductions to insurance partners but is not itself an insurer; final policy terms are between the buyer and the insurance provider.',
      'A car with expired or no insurance will be clearly marked as such on its listing. We recommend buyers confirm current insurance status directly with the seller/admin before finalizing a purchase.',
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    updatedAt: '2026-08-01',
    body: [
      'By creating an account on RP Car Showroom, you agree to provide accurate information and to use the platform only for legitimate buying/browsing of vehicles.',
      'All car listings are reviewed and published by RP Car Showroom directly. Prices and availability are subject to change without notice until a sale is finalized.',
      'Test-ride bookings are requests, not guarantees — each is confirmed or declined by our team, and you will be notified by email either way.',
      'RP Car Showroom reserves the right to suspend accounts that misuse the platform, submit fraudulent booking requests, or violate these terms.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updatedAt: '2026-08-01',
    body: [
      'We collect the information you provide at registration (name, email, phone, city) and booking details (preferred date, messages) to operate the platform.',
      'Your contact information is shared with our internal team to process test-ride bookings and is not sold to third parties.',
      'Passwords are stored using industry-standard hashing (bcrypt) and are never stored or transmitted in plain text.',
      'You may request account deletion at any time by contacting our team; we will remove your personal data except where retention is required for legal/financial record-keeping.',
    ],
  },
  cancellation: {
    title: 'Cancellation & Refund Policy',
    updatedAt: '2026-08-01',
    body: [
      'Test-ride bookings can be cancelled by the buyer at any time before the confirmed date at no cost.',
      'RP Car Showroom reserves the right to reschedule or cancel a confirmed test ride due to vehicle unavailability; buyers will be notified by email as early as possible.',
      'This platform currently facilitates test-ride bookings only — no payments are processed through the site, so no refund process applies to bookings themselves.',
      'Any deposit or payment arrangements made directly with the showroom for a vehicle purchase are governed by the terms agreed at the time of that transaction, not by this online booking system.',
    ],
  },
};

exports.getAllPolicies = (req, res) => {
  res.json(policies);
};

exports.getPolicy = (req, res) => {
  const policy = policies[req.params.key];
  if (!policy) return res.status(404).json({ message: 'Policy not found' });
  res.json(policy);
};
