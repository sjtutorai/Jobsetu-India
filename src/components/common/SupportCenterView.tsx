import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { SupportTicket } from '../../types';
import {
  HelpCircle,
  ShieldAlert,
  Send,
  CheckCircle2,
  FileText,
  Scale,
  Lock,
  MessageSquare
} from 'lucide-react';

export const SupportCenterView: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState<SupportTicket['category']>('General Help');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submittedRef, setSubmittedRef] = useState('');

  const fetchMyTickets = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const q = query(collection(db, 'supportTickets'), where('userId', '==', currentUser.uid));
      const snap = await getDocs(q).catch(() => null);
      if (snap) {
        const list: SupportTicket[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setTickets(list);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, [currentUser?.uid]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !subject.trim() || !description.trim()) return;
    try {
      setSubmitting(true);
      const refId = `TKT-${Date.now().toString().slice(-6)}`;
      const payload: Omit<SupportTicket, 'id'> = {
        referenceId: refId,
        userId: currentUser.uid,
        userName: userProfile?.name || currentUser.displayName || 'User',
        userEmail: userProfile?.email || currentUser.email || '',
        userRole: userProfile?.activeRole || 'worker',
        category,
        subject: subject.trim(),
        description: description.trim(),
        status: 'Open',
        assignedToRole:
          category === 'Payment Scam / Fraud Report'
            ? 'Job Moderator'
            : category === 'Account & Verification'
            ? 'Verification Admin'
            : 'Support Admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'supportTickets'), payload).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, 'supportTickets');
        return null;
      });
      setTickets((prev) => [{ id: docRef?.id || `local_${Date.now()}`, ...payload }, ...prev]);
      setSubmittedRef(refId);
      setSubject('');
      setDescription('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Help Centre, Fraud Escalation & Support Tickets
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Submit a support ticket, report a suspicious recruitment fee demand, or appeal a moderation decision. Support staff will never ask for your password or OTP.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Submit Ticket Form */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Create Support or Fraud Escalation Ticket
          </h3>

          {submittedRef && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Ticket submitted! Reference ID: <strong className="font-mono">{submittedRef}</strong>
              </span>
            </div>
          )}

          <form onSubmit={handleSubmitTicket} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Issue Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SupportTicket['category'])}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="General Help">General Help & Account Support</option>
                <option value="Payment Scam / Fraud Report">
                  Report Recruitment Fee / Payment Scam Demand
                </option>
                <option value="Account & Verification">Verification Status / Document Help</option>
                <option value="Appeal Decision">Appeal Moderation or Account Decision</option>
                <option value="Privacy / Data Request">Privacy, Data Correction or Deletion</option>
                <option value="Bug / Technical Issue">Report a Technical Bug</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your issue or report"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Detailed Explanation *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include job title, employer name, or reference ID if applicable. Never include passwords or OTPs."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#267BE8] hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting Ticket...' : 'Submit Ticket'}</span>
            </button>
          </form>
        </div>

        {/* Ticket History & Community Rules */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              My Support Tickets ({tickets.length})
            </h3>
            {loading ? (
              <p className="text-xs text-slate-500 py-4">Loading tickets...</p>
            ) : tickets.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">
                You have no open support tickets. Use the form to contact JOBSETU Support.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                {tickets.map((t) => (
                  <div key={t.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#267BE8]">{t.referenceId}</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        Status: {t.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{t.subject}</p>
                    <p className="text-[11px] text-slate-500">{t.category}</p>
                    {t.adminResponse && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-lg mt-1">
                        Support Response: {t.adminResponse}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Zero-Fee & Adult Eligibility Rules</span>
            </div>
            <p>
              1. <strong>Never Pay for a Job:</strong> Demanding registration fees, security deposits, or training charges from job seekers is strictly banned on JOBSETU.
            </p>
            <p>
              2. <strong>18+ Adult Employment Only:</strong> JOBSETU is strictly for adults aged 18 and above.
            </p>
            <p>
              3. <strong>Verification Scope:</strong> Verification badges indicate reviewed business or identity evidence on file; always exercise standard workplace caution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
