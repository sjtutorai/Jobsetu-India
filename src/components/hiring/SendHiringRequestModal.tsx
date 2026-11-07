import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobContext';
import { WorkerProfile, Job } from '../../types';
import {
  X,
  Send,
  Briefcase,
  IndianRupee,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface SendHiringRequestModalProps {
  worker: WorkerProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SendHiringRequestModal: React.FC<SendHiringRequestModalProps> = ({
  worker,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { employerProfile } = useAuth();
  const { myJobs, sendHiringRequest } = useJobs();

  const [selectedJobId, setSelectedJobId] = useState<string>('custom');
  const [jobTitle, setJobTitle] = useState<string>(worker?.skills?.[0] ? `${worker.skills[0]} Specialist` : 'Job Offer');
  const [offeredSalary, setOfferedSalary] = useState<string>(
    worker?.jobPreferences?.expectedSalary ? `₹${worker.jobPreferences.expectedSalary} / month` : '₹22,000 / month'
  );
  const [workplaceLocation, setWorkplaceLocation] = useState<string>(
    employerProfile?.city ? `${employerProfile.city}, ${employerProfile.state}` : 'On-site Facility'
  );
  const [workTimings, setWorkTimings] = useState<string>('9:00 AM - 6:00 PM (Monday - Saturday)');
  const [joiningDate, setJoiningDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [message, setMessage] = useState<string>(
    `Hello ${worker?.fullName || 'there'}, we were impressed by your verified qualifications on JOBSETU and would like to extend a direct hiring offer for our team.`
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !worker) return null;

  // When job selected from myJobs
  const handleSelectJob = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedJobId(val);
    if (val !== 'custom') {
      const match = myJobs.find((j) => j.id === val);
      if (match) {
        setJobTitle(match.title);
        setOfferedSalary(`₹${match.minSalary} - ₹${match.maxSalary} (${match.paymentFrequency})`);
        setWorkplaceLocation(`${match.city}, ${match.state}`);
        if (match.workingHours) setWorkTimings(match.workingHours);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !offeredSalary || !workplaceLocation || !joiningDate) {
      setError('Please fill in all hiring offer details.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await sendHiringRequest({
        workerId: worker.uid,
        workerName: worker.fullName || 'Candidate',
        workerPhoto: worker.profilePhoto,
        workerProfession: worker.skills?.[0] || 'Worker',
        jobId: selectedJobId !== 'custom' ? selectedJobId : undefined,
        jobTitle,
        offeredSalary,
        workplaceLocation,
        workplaceLat: employerProfile?.lat,
        workplaceLng: employerProfile?.lng,
        workTimings,
        joiningDate,
        message
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error sending hiring request:', err);
      setError(err.message || 'Failed to send hiring request. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Send Direct Hiring Request</h3>
              <p className="text-xs text-gray-500">
                To: <span className="font-bold text-gray-800">{worker.fullName}</span> ({worker.skills?.[0] || 'Candidate'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 text-red-700 border border-red-100 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Existing Job or Custom Offer */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Select Associated Vacancy
            </label>
            <select
              value={selectedJobId}
              onChange={handleSelectJob}
              className="w-full p-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="custom">Direct Custom Hiring Offer</option>
              {myJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} (₹{j.minSalary} - ₹{j.maxSalary})
                </option>
              ))}
            </select>
          </div>

          {/* Job Title */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Designation / Role Offered *
            </label>
            <input
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-semibold focus:bg-white focus:border-amber-500 focus:outline-hidden"
              placeholder="e.g. Senior Electrician / Store Cashier / Driver"
            />
          </div>

          {/* Salary & Location Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Offered Salary / Daily Wage *
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={offeredSalary}
                  onChange={(e) => setOfferedSalary(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-semibold focus:bg-white focus:border-amber-500 focus:outline-hidden"
                  placeholder="e.g. ₹24,000 / month or ₹800 / day"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Workplace Location *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={workplaceLocation}
                  onChange={(e) => setWorkplaceLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-semibold focus:bg-white focus:border-amber-500 focus:outline-hidden"
                  placeholder="Facility address or city"
                />
              </div>
            </div>
          </div>

          {/* Timings & Joining Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Work Timings & Schedule *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={workTimings}
                  onChange={(e) => setWorkTimings(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-semibold focus:bg-white focus:border-amber-500 focus:outline-hidden"
                  placeholder="e.g. 9:00 AM - 6:00 PM"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Expected Joining Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-semibold focus:bg-white focus:border-amber-500 focus:outline-hidden cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Personalized Message */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Personalized Offer Note
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-medium focus:bg-white focus:border-amber-500 focus:outline-hidden"
              placeholder="Introduce your enterprise and highlight key role perks..."
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Sending Request...' : 'Send Hiring Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
