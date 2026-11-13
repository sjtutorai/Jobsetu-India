import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  HelpCircle,
  FileText,
  Briefcase,
  Users,
  CheckCircle2,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SmokeReveal } from '../animations';

export type ModalType = 'about' | 'how-it-works' | 'contact' | 'privacy' | 'terms' | 'help';

interface ContentModalsProps {
  activeModal: ModalType | null;
  onClose: () => void;
  onSelectRole?: (role: 'worker' | 'employer') => void;
}

export const ContentModals: React.FC<ContentModalsProps> = ({
  activeModal,
  onClose,
  onSelectRole
}) => {
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <AnimatePresence>
      {activeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8 max-h-[85vh] flex flex-col"
          >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-amber-50/50 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-gray-900 tracking-tight">
              JOB<span className="text-[#2563EB]">SETU</span>
            </span>
            <span className="text-xs font-bold text-gray-400 capitalize">
              | {activeModal.replace('-', ' ')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto text-sm text-gray-700 space-y-5">
          <SmokeReveal>
          {/* ABOUT US */}
          {activeModal === 'about' && (
            <div className="space-y-4">
              <h3 className="text-2xl font-extrabold text-[#111827]">
                Connecting People. Creating Opportunities.
              </h3>
              <p className="leading-relaxed">
                <strong>JOBSETU</strong> is an India-wide employment connectivity platform established to bridge the gap between skilled job seekers and ethical employers across all 28 States and 8 Union Territories.
              </p>
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <h4 className="font-bold text-[#2563EB] mb-1">Our Core Pillars</h4>
                <ul className="space-y-1.5 text-xs text-blue-900">
                  <li>• <strong>Universal Dignity:</strong> Zero fees charged to candidates or daily wage workers.</li>
                  <li>• <strong>Verified Employers:</strong> Every hiring business is vetted via registration IDs.</li>
                  <li>• <strong>Unified Identity:</strong> Seamless dual-role support for seekers and employers.</li>
                  <li>• <strong>Hyperlocal Reach:</strong> Search by state, district, city, and 6-digit PIN code.</li>
                </ul>
              </div>
              <p className="leading-relaxed text-xs text-gray-500">
                From rural artisans and ITI technicians to retail managers and software developers, JOBSETU turns aspiration into sustainable livelihoods.
              </p>
            </div>
          )}

          {/* HOW IT WORKS */}
          {activeModal === 'how-it-works' && (
            <div className="space-y-5">
              <h3 className="text-2xl font-extrabold text-[#111827]">
                How JOBSETU Operates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
                  <h4 className="font-bold text-[#2563EB] text-sm mb-2">For Job Seekers</h4>
                  <ol className="space-y-2 text-xs text-gray-700 list-decimal pl-4">
                    <li>Sign up with Google, Email, or Mobile OTP.</li>
                    <li>Complete the 7-step onboarding form (18+ confirmed).</li>
                    <li>Highlight skills across 8 sectors or add custom skills.</li>
                    <li>Receive direct employment offers with zero fee cuts.</li>
                  </ol>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <h4 className="font-bold text-amber-800 text-sm mb-2">For Employers</h4>
                  <ol className="space-y-2 text-xs text-gray-700 list-decimal pl-4">
                    <li>Register owner details and trade name.</li>
                    <li>Submit registration ID (GST/PAN/Shop Act) for audit.</li>
                    <li>Access regional talent pools by district & PIN code.</li>
                    <li>Hire suitable candidates directly.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* CONTACT */}
          {activeModal === 'contact' && (
            <div className="space-y-4">
              <h3 className="text-2xl font-extrabold text-[#111827]">Get in Touch</h3>
              <p className="text-xs text-gray-500">
                Our support team is available across India 6 days a week (9:00 AM - 7:00 PM IST).
              </p>

              {contactSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <p className="font-bold text-emerald-900 text-base">Message Sent Successfully</p>
                  <p className="text-xs text-emerald-700">
                    A JOBSETU representative will respond to your query within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Amit Verma"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs outline-none focus:border-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email / Mobile Number</label>
                    <input
                      type="text"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="contact@example.com or +91 9876543210"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs outline-none focus:border-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">How can we help you?</label>
                    <textarea
                      required
                      rows={3}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Describe your inquiry, business registration help, or worker assistance..."
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs outline-none focus:border-[#2563EB]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Message to JOBSETU Desk</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* PRIVACY POLICY */}
          {activeModal === 'privacy' && (
            <div className="space-y-4">
              <h3 className="text-2xl font-extrabold text-[#111827]">Privacy Policy</h3>
              <p className="text-xs text-gray-500">Effective Date: November 2026</p>
              <p className="leading-relaxed text-xs">
                JOBSETU prioritizes the data sovereignty and confidentiality of Indian citizens. We strictly protect Personal Identifiable Information (PII) including email addresses, phone numbers, and physical addresses.
              </p>
              <h4 className="font-bold text-gray-900 text-xs uppercase">Data Protection Standards:</h4>
              <ul className="space-y-1.5 text-xs text-gray-600 list-disc pl-5">
                <li>Never sold to third-party telemarketing networks.</li>
                <li>Accessible only by verified employers when a candidate applies or shares contact.</li>
                <li>Encrypted in transit and at rest on secure cloud databases.</li>
                <li>Compliant with the Digital Personal Data Protection Act (DPDPA).</li>
              </ul>
            </div>
          )}

          {/* TERMS AND CONDITIONS */}
          {activeModal === 'terms' && (
            <div className="space-y-4">
              <h3 className="text-2xl font-extrabold text-[#111827]">Terms and Conditions</h3>
              <p className="text-xs text-gray-500">Governing employment connectivity in India</p>
              <ul className="space-y-2 text-xs text-gray-600 list-disc pl-5 leading-relaxed">
                <li><strong>Age Eligibility:</strong> Job seekers must confirm they are at least 18 years of age.</li>
                <li><strong>Zero Fee Guarantee:</strong> No agency or employer may solicit money, deposits, or processing fees from job seekers on JOBSETU.</li>
                <li><strong>Verification Honesty:</strong> Employers must provide authentic registration documentation. Submitting fraudulent identifiers results in immediate blacklisting.</li>
                <li><strong>Responsible Conduct:</strong> Communications between parties must remain professional and respectful at all times.</li>
              </ul>
            </div>
          )}

          {/* HELP CENTRE */}
          {activeModal === 'help' && (
            <div className="space-y-4">
              <h3 className="text-2xl font-extrabold text-[#111827]">Help Centre & FAQs</h3>
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="font-bold text-xs text-gray-900">Can I be both a Job Seeker and an Employer?</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Yes! One JOBSETU account supports dual roles. You can activate both roles and easily switch between them without creating a separate login.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="font-bold text-xs text-gray-900">Why is my Employer Verification status Pending?</p>
                  <p className="text-xs text-gray-600 mt-1">
                    JOBSETU adheres to a strict "never unearned" badge rule. Our compliance team verifies your business document within 24-48 hours.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="font-bold text-xs text-gray-900">Is JOBSETU free for job seekers?</p>
                  <p className="text-xs text-gray-600 mt-1">
                    100% free forever. No registration fee, no interview fee, no placement cut.
                  </p>
                </div>
              </div>
            </div>
          )}
          </SmokeReveal>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
