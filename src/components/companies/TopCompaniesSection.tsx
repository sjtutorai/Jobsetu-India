import React, { useState, useMemo } from 'react';
import { useJobs } from '../../context/JobContext';
import { CompanyProfile, COMPANY_INDUSTRIES, CompanyIndustry } from '../../types';
import { VERIFIED_COMPANIES_DATA, CAREER_GUIDANCE_PATHS } from '../../lib/companiesData';
import { CompanyDetailModal } from './CompanyDetailModal';
import {
  Building2,
  Search,
  ExternalLink,
  ShieldCheck,
  Bookmark,
  Sparkles,
  MapPin,
  TrendingUp,
  ArrowRight,
  Briefcase,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

interface TopCompaniesSectionProps {
  onOpenAIAssistant?: (companyContext?: string) => void;
  isStandalonePage?: boolean;
}

export const TopCompaniesSection: React.FC<TopCompaniesSectionProps> = ({
  onOpenAIAssistant,
  isStandalonePage = false
}) => {
  const { savedCompanyIds, toggleSaveCompany } = useJobs();

  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [onlySaved, setOnlySaved] = useState<boolean>(false);
  const [activeCompany, setActiveCompany] = useState<CompanyProfile | null>(null);

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return VERIFIED_COMPANIES_DATA.filter((comp) => {
      // Industry filter
      if (selectedIndustry !== 'all' && comp.industry !== selectedIndustry) {
        return false;
      }

      // Search term
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const matchName = comp.name.toLowerCase().includes(s);
        const matchHq = comp.headquarters.toLowerCase().includes(s);
        const matchInd = comp.industry.toLowerCase().includes(s);
        if (!matchName && !matchHq && !matchInd) return false;
      }

      // Only saved
      if (onlySaved && !savedCompanyIds.includes(comp.id)) {
        return false;
      }

      return true;
    });
  }, [selectedIndustry, searchTerm, onlySaved, savedCompanyIds]);

  return (
    <section className={`space-y-8 ${isStandalonePage ? 'animate-in fade-in' : 'py-12 bg-slate-50/70 border-t border-b border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-blue-600">
                Official Career Ecosystem
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Top Companies to Join in India
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-2xl leading-relaxed">
              Discover verified corporate employers, public sector giants, and retail networks across India. Review eligibility guidelines and access official career recruitment portals directly.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOnlySaved(!onlySaved)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                onlySaved
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-xs'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({savedCompanyIds.length})</span>
            </button>

            {onOpenAIAssistant && (
              <button
                type="button"
                onClick={() => onOpenAIAssistant('Top Companies in India')}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Career Guide</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Industry Selector Carousel */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search top companies by name, headquarters (e.g. TCS, SBI, Tata Motors, Reliance)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          {/* 14 Industry Categories Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedIndustry('all')}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                selectedIndustry === 'all'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Industries ({VERIFIED_COMPANIES_DATA.length})
            </button>
            {COMPANY_INDUSTRIES.map((ind) => (
              <button
                key={ind}
                type="button"
                onClick={() => setSelectedIndustry(ind)}
                className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  selectedIndustry === ind
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((comp) => {
            const isSaved = savedCompanyIds.includes(comp.id);

            return (
              <div
                key={comp.id}
                onClick={() => setActiveCompany(comp)}
                className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-5 cursor-pointer group"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={comp.logo}
                        alt={comp.name}
                        className="w-14 h-14 rounded-2xl object-cover bg-white p-1 border border-gray-200 shadow-xs group-hover:scale-105 transition-transform"
                      />
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                          {comp.industry}
                        </span>
                        <h3 className="text-base font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {comp.name}
                        </h3>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveCompany(comp.id, comp.name, comp.logo, comp.industry);
                      }}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        isSaved ? 'text-amber-600 bg-amber-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                      title={isSaved ? 'Remove Bookmark' : 'Bookmark Company'}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Overview snippet */}
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {comp.overview}
                  </p>

                  {/* Details Badges */}
                  <div className="space-y-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{comp.headquarters}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified Opportunities
                      </span>
                      {comp.openVacanciesCount > 0 && (
                        <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          ~{comp.openVacanciesCount} Vacancies
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>View Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>

                  <a
                    href={comp.careersPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Careers Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* EXPLORE CAREER OPPORTUNITIES SUB-SECTION */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
                Career Roadmap
              </span>
              <h3 className="text-xl font-extrabold text-gray-900">
                Explore Career Opportunities & Skill Pathways
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Understand in-demand roles, expected salary benchmarks, and progression paths across Indian industries.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CAREER_GUIDANCE_PATHS.map((path, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                    {path.category}
                  </span>
                  <h4 className="font-extrabold text-gray-900 text-sm">
                    {path.role}
                  </h4>
                  <div className="text-xs font-black text-emerald-700">
                    {path.avgSalary}
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    <strong>Growth:</strong> {path.growthPath}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Recommended Certificates</span>
                  <div className="flex flex-wrap gap-1">
                    {path.certifications.map((c, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded-sm bg-white border border-gray-200 text-gray-700 text-[10px]">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Company Detail Modal */}
      <CompanyDetailModal
        company={activeCompany}
        isOpen={Boolean(activeCompany)}
        onClose={() => setActiveCompany(null)}
        isSaved={activeCompany ? savedCompanyIds.includes(activeCompany.id) : false}
        onToggleSave={(c) => toggleSaveCompany(c.id, c.name, c.logo, c.industry)}
        onAskAI={onOpenAIAssistant}
      />
    </section>
  );
};
