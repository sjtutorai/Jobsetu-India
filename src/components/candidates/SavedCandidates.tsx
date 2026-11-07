import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useJobs } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import { WorkerProfile } from '../../types';
import { calculateDistance } from '../../lib/geo';
import {
  Bookmark,
  Users,
  Search,
  MapPin,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

interface SavedCandidatesProps {
  onDiscoverCandidates: () => void;
  onOpenChat?: (conversationId: string) => void;
}

export const SavedCandidates: React.FC<SavedCandidatesProps> = ({
  onDiscoverCandidates,
  onOpenChat
}) => {
  const { savedCandidateIds, toggleSaveCandidate, startConversation } = useJobs();
  const { employerProfile } = useAuth();
  const [allWorkers, setAllWorkers] = useState<WorkerProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const employerLat = employerProfile?.lat || 19.0760;
  const employerLng = employerProfile?.lng || 72.8777;

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'workerProfiles'),
      (snap) => {
        const list: WorkerProfile[] = [];
        snap.forEach((doc) => list.push(doc.data() as WorkerProfile));
        setAllWorkers(list);
        setLoading(false);
      },
      (err) => {
        console.warn('SavedCandidates snapshot notice:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const savedList = allWorkers.filter((w) => savedCandidateIds.includes(w.uid));

  const filtered = savedList.filter((w) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      w.fullName.toLowerCase().includes(q) ||
      (w.city && w.city.toLowerCase().includes(q)) ||
      (w.skills && w.skills.some((s) => s.toLowerCase().includes(q)))
    );
  });

  const handleStartChat = async (w: WorkerProfile) => {
    try {
      const convId = await startConversation(
        w.uid,
        w.fullName,
        w.profilePhoto || '',
        'worker',
        'Direct Candidate Outreach'
      );
      if (onOpenChat) onOpenChat(convId);
    } catch (err) {
      console.error('Failed to chat:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Bookmarked Candidates</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Workers you have bookmarked for potential recruitment or upcoming vacancies.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold self-start sm:self-auto">
            {savedList.length} Bookmarked
          </span>
        </div>

        {savedList.length > 0 && (
          <div className="pt-4 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by candidate name or skill..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
          <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500">Loading saved candidates...</p>
        </div>
      ) : savedList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
          <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No saved candidates yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
            Discover verified workers in the talent directory and bookmark candidates for direct outreach.
          </p>
          <button
            type="button"
            onClick={onDiscoverCandidates}
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Search Candidate Directory</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((w) => {
            const rawDist =
              w.lat && w.lng
                ? calculateDistance(employerLat, employerLng, w.lat, w.lng)
                : null;
            const dist = rawDist !== null ? Math.round(rawDist) : null;

            return (
              <div
                key={w.uid}
                className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {w.profilePhoto ? (
                        <img
                          src={w.profilePhoto}
                          alt={w.fullName}
                          className="w-12 h-12 rounded-2xl object-cover border border-blue-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#2563EB] font-bold text-sm flex items-center justify-center">
                          {w.fullName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{w.fullName}</h3>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-500" />
                          <span>{w.city ? `${w.city}, ` : ''}{w.state}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSaveCandidate(w.uid)}
                      className="p-1.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 cursor-pointer"
                      title="Remove from saved"
                    >
                      <Bookmark className="w-4 h-4 fill-amber-500" />
                    </button>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-gray-600">
                    <p className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                      <span>{w.experience || 'Fresher'}</span>
                    </p>
                    {dist !== null && (
                      <p className="text-[11px] font-semibold text-emerald-700">
                        Approx {dist} km from your business location
                      </p>
                    )}
                  </div>

                  {w.skills && w.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {w.skills.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartChat(w)}
                    className="w-full py-2 px-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
