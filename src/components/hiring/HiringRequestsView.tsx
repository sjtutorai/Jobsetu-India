import React, { useState } from 'react';
import { useJobs } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import { HiringRequest, HiringRequestStatus } from '../../types';
import {
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  IndianRupee,
  MapPin,
  Calendar,
  Building2,
  User,
  MessageSquare,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface HiringRequestsViewProps {
  role: 'worker' | 'employer';
  onOpenChat?: (convId: string) => void;
}

export const HiringRequestsView: React.FC<HiringRequestsViewProps> = ({
  role,
  onOpenChat
}) => {
  const { hiringRequests, updateHiringRequestStatus, startConversation } = useJobs();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Accepted' | 'Declined'>('All');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('');
  const [showDeclineModal, setShowDeclineModal] = useState<boolean>(false);
  const [targetRequest, setTargetRequest] = useState<HiringRequest | null>(null);

  const filteredRequests = hiringRequests.filter((hr) => {
    if (activeTab === 'All') return true;
    return hr.status === activeTab;
  });

  const handleAccept = async (request: HiringRequest) => {
    try {
      await updateHiringRequestStatus(request.id, 'Accepted', 'Candidate accepted the hiring offer.');
      if (onOpenChat) {
        const convId = await startConversation(
          role === 'worker' ? request.employerId : request.workerId,
          role === 'worker' ? request.employerName : request.workerName,
          role === 'worker' ? request.employerLogo : request.workerPhoto,
          role === 'worker' ? 'employer' : 'worker',
          `Hello! I have accepted the hiring offer for ${request.jobTitle}. Looking forward to joining on ${request.joiningDate}.`
        );
        onOpenChat(convId);
      }
    } catch (err) {
      console.error('Error accepting hiring request:', err);
    }
  };

  const handleDecline = async () => {
    if (!targetRequest) return;
    try {
      await updateHiringRequestStatus(targetRequest.id, 'Declined', declineReason || 'Declined by candidate');
      setShowDeclineModal(false);
      setTargetRequest(null);
      setDeclineReason('');
    } catch (err) {
      console.error('Error declining request:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-amber-600" />
            <span>{role === 'worker' ? 'Incoming Direct Hiring Offers' : 'Sent Hiring Requests'}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {role === 'worker'
              ? 'Official job offers sent directly to you by verified employers across India.'
              : 'Direct offers dispatched to verified local workforce candidates.'}
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-2xl text-xs font-bold self-start sm:self-auto">
          {(['All', 'Pending', 'Accepted', 'Declined'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* List of Requests */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
          <Send className="w-12 h-12 text-gray-300 mx-auto" />
          <h4 className="text-base font-bold text-gray-900">
            No {activeTab.toLowerCase()} hiring requests
          </h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {role === 'worker'
              ? 'Employers who find your profile suitable will send direct offers with salary and joining dates here.'
              : 'Send direct offers to skilled and general workers from the Workers Near Me radar.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => {
            const isPending = req.status === 'Pending';
            const isAccepted = req.status === 'Accepted';
            const isDeclined = req.status === 'Declined';

            return (
              <div
                key={req.id}
                className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {role === 'worker' ? (
                      req.employerLogo ? (
                        <img
                          src={req.employerLogo}
                          alt={req.employerName}
                          className="w-12 h-12 rounded-2xl object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-lg">
                          {(req.employerName || 'E').charAt(0)}
                        </div>
                      )
                    ) : (
                      req.workerPhoto ? (
                        <img
                          src={req.workerPhoto}
                          alt={req.workerName}
                          className="w-12 h-12 rounded-2xl object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-lg">
                          {(req.workerName || 'W').charAt(0)}
                        </div>
                      )
                    )}

                    <div>
                      <h4 className="text-sm font-black text-gray-900">{req.jobTitle}</h4>
                      <p className="text-xs font-semibold text-gray-600 flex items-center gap-1 mt-0.5">
                        {role === 'worker' ? (
                          <>
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            <span>{req.employerName}</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span>{req.workerName} ({req.workerProfession || 'Worker'})</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isAccepted
                        ? 'bg-emerald-100 text-emerald-800'
                        : isDeclined
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-900 animate-pulse'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                {/* Offer Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Offered Wage / Salary</span>
                    <span className="font-extrabold text-emerald-700 mt-0.5 block">
                      {req.offeredSalary}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Joining Date</span>
                    <span className="font-bold text-gray-900 mt-0.5 block flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {req.joiningDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Location</span>
                    <span className="font-semibold text-gray-700 truncate mt-0.5 block flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {req.workplaceLocation}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Work Timings</span>
                    <span className="font-semibold text-gray-700 truncate mt-0.5 block flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {req.workTimings}
                    </span>
                  </div>
                </div>

                {/* Message from sender */}
                {req.message && (
                  <p className="text-xs text-gray-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100 italic">
                    "{req.message}"
                  </p>
                )}

                {/* Response Note if accepted or declined */}
                {req.responseNote && (
                  <p className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <strong>Response Note:</strong> {req.responseNote}
                  </p>
                )}

                {/* Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  {onOpenChat && (
                    <button
                      type="button"
                      onClick={async () => {
                        const targetId = role === 'worker' ? req.employerId : req.workerId;
                        const targetName = role === 'worker' ? req.employerName : req.workerName;
                        const targetPhoto = role === 'worker' ? req.employerLogo : req.workerPhoto;
                        const convId = await startConversation(
                          targetId,
                          targetName,
                          targetPhoto,
                          role === 'worker' ? 'employer' : 'worker',
                          `Hello, regarding the hiring request for ${req.jobTitle}...`
                        );
                        onOpenChat(convId);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat / Inquire</span>
                    </button>
                  )}

                  {role === 'worker' && isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetRequest(req);
                          setShowDeclineModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Decline
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAccept(req)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept Offer</span>
                      </button>
                    </div>
                  )}

                  {role === 'employer' && isPending && (
                    <button
                      type="button"
                      onClick={() => updateHiringRequestStatus(req.id, 'Cancelled')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      Cancel Offer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h4 className="text-sm font-bold text-gray-900">Decline Hiring Offer</h4>
            <p className="text-xs text-gray-500">
              Please share a brief reason with {targetRequest?.employerName} (e.g. location distance, salary expectation, already employed).
            </p>
            <textarea
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Reason for declining..."
              className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-hidden"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleDecline}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs cursor-pointer"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
