import React from 'react';
import { CompanyProfile } from '../../types';
import {
  X,
  ExternalLink,
  Building2,
  MapPin,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Sparkles,
  Bookmark,
  CheckCircle2,
  Calendar,
  Layers,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedImage } from '../animations';

interface CompanyDetailModalProps {
  company: CompanyProfile | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved?: boolean;
  onToggleSave?: (company: CompanyProfile) => void;
  onAskAI?: (companyName: string) => void;
}

export const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({
  company,
  isOpen,
  onClose,
  isSaved = false,
  onToggleSave,
  onAskAI
}) => {
  return (
    <AnimatePresence>
      {isOpen && company && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col"
          >
            {/* Header Banner */}
            <div className="relative p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-t-3xl overflow-hidden">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <AnimatedImage
                  variant="rotationEntrance"
                  src={company.logo}
                  alt={company.name}
                  className="w-20 h-20 rounded-2xl object-cover bg-white p-1 border-2 border-white/20 shadow-lg shrink-0"
                />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {company.industry}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 flex items-center gap-1 border border-emerald-400/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Directory Profile
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {company.name}
              </h2>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>Headquarters: {company.headquarters}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 flex-1 text-xs text-gray-700">
          {/* Overview */}
          <div>
            <h4 className="font-extrabold text-gray-900 uppercase tracking-wider text-[11px] mb-2">
              Company Overview & Operations
            </h4>
            <p className="leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 text-gray-600">
              {company.overview}
            </p>
          </div>

          {/* Quick Links Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={company.officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-400 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-gray-900 group-hover:text-blue-600">
                  Official Corporate Website
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
            </a>

            <a
              href={company.careersPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 hover:bg-blue-100/70 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 text-blue-700" />
                <span className="font-extrabold text-blue-900">
                  Official Careers Portal
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
            </a>
          </div>

          {/* Business Sectors & Key Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <h5 className="font-bold text-gray-900 uppercase tracking-wider text-[10px]">
                Business Sectors
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {company.businessSectors.map((sec, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700 text-[11px] font-medium">
                    {sec}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <h5 className="font-bold text-gray-900 uppercase tracking-wider text-[10px]">
                In-Demand Skill Sets
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {company.commonSkills.map((sk, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700 text-[11px] font-medium">
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* General Eligibility */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-1">
            <h5 className="font-bold text-amber-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-amber-700" />
              <span>General Recruitment Eligibility</span>
            </h5>
            <p className="text-amber-950 font-medium leading-relaxed">
              {company.generalEligibility}
            </p>
          </div>

          {/* Verified Active Vacancies */}
          {company.sampleVacancies && company.sampleVacancies.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-gray-900 uppercase tracking-wider text-[11px]">
                  Sample Verified Opportunities ({company.sampleVacancies.length})
                </h4>
                <span className="text-[10px] font-bold text-gray-500">
                  Last verified: {company.lastVerifiedDate}
                </span>
              </div>

              <div className="space-y-2.5">
                {company.sampleVacancies.map((vac) => (
                  <div
                    key={vac.id}
                    className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-blue-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <h5 className="font-bold text-gray-900 text-sm">{vac.title}</h5>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 mt-1">
                        <span>📍 {vac.location}</span>
                        <span>• 💼 {vac.experienceLevel}</span>
                        <span className="text-emerald-700 font-semibold">• Active Recruitment</span>
                      </div>
                    </div>

                    <a
                      href={vac.officialApplyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                    >
                      <span>Apply on Official Site</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 rounded-b-3xl">
          <div className="flex items-center gap-2">
            {onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(company)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isSaved
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Saved in Favourites' : 'Save Company'}</span>
              </button>
            )}

            {onAskAI && (
              <button
                type="button"
                onClick={() => onAskAI(company.name)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Eligibility Prep</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
