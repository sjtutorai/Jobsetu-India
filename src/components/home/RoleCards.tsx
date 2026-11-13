import React from 'react';
import { UserCheck, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../../types';
import {
  CreativeEntrance,
  TiltCard3D,
  HoverSpotlightCard,
  MagneticButton,
  RippleContainer,
  VerticalRevealText
} from '../animations';

interface RoleCardsProps {
  onSelectRole: (role: UserRole) => void;
}

export const RoleCards: React.FC<RoleCardsProps> = ({ onSelectRole }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto w-full">
      {/* CARD 1: Job Seeker */}
      <CreativeEntrance variant="flyLeft" delay={0.18}>
        <TiltCard3D className="h-full">
          <HoverSpotlightCard
            spotlightColor="rgba(37, 99, 235, 0.08)"
            className="relative group rounded-3xl bg-white p-8 sm:p-10 border-2 border-blue-100 hover:border-[#2563EB] shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between h-full jobsetu-glow-border"
          >
            <div className="absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#2563EB] border border-blue-200">
              Job Seekers
            </div>

            <div>
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-300 shadow-md shadow-blue-500/10 jobsetu-float-3d">
                <UserCheck className="w-8 h-8" />
              </div>

              {/* Heading & Description */}
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mb-3">
                <VerticalRevealText text="I am seeking a job." delay={0.25} />
              </h3>
              <p className="text-base text-[#6B7280] leading-relaxed mb-6">
                Find suitable jobs, showcase your skills and connect with employers.
              </p>

              {/* Highlights */}
              <ul className="space-y-2.5 mb-8 text-sm text-gray-700 text-left">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Full-time, part-time, technical & local opportunities</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Direct contact with verified employers — 0% fee</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Skill showcase across 8 vocational sectors</span>
                </li>
              </ul>
            </div>

            {/* Button */}
            <MagneticButton className="w-full" strength={0.14}>
              <RippleContainer className="w-full rounded-2xl">
                <button
                  onClick={() => onSelectRole('worker')}
                  className="w-full py-4 px-6 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 group/btn transition-all duration-200 hover:-translate-y-0.5 cursor-pointer jobsetu-liquid-btn"
                >
                  <span>Find Jobs</span>
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </RippleContainer>
            </MagneticButton>
          </HoverSpotlightCard>
        </TiltCard3D>
      </CreativeEntrance>

      {/* CARD 2: Employer */}
      <CreativeEntrance variant="flyRight" delay={0.25}>
        <TiltCard3D className="h-full">
          <HoverSpotlightCard
            spotlightColor="rgba(245, 158, 11, 0.09)"
            className="relative group rounded-3xl bg-white p-8 sm:p-10 border-2 border-amber-100 hover:border-[#F59E0B] shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between h-full jobsetu-glow-border"
          >
            <div className="absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
              Employers
            </div>

            <div>
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#F59E0B] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#F59E0B] group-hover:text-white transition-all duration-300 shadow-md shadow-amber-500/10 jobsetu-float-3d">
                <Users className="w-8 h-8" />
              </div>

              {/* Heading & Description */}
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mb-3">
                <VerticalRevealText text="I want to hire employees." delay={0.3} />
              </h3>
              <p className="text-base text-[#6B7280] leading-relaxed mb-6">
                Find skilled workers and recruit suitable candidates for your business.
              </p>

              {/* Highlights */}
              <ul className="space-y-2.5 mb-8 text-sm text-gray-700 text-left">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Reach candidate talent pools across all Indian states</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Filtered by vocational skills, experience & district</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verified business badge and direct recruitment</span>
                </li>
              </ul>
            </div>

            {/* Button */}
            <MagneticButton className="w-full" strength={0.14}>
              <RippleContainer className="w-full rounded-2xl">
                <button
                  onClick={() => onSelectRole('employer')}
                  className="w-full py-4 px-6 rounded-2xl bg-[#F59E0B] hover:bg-amber-600 text-white font-bold text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 group/btn transition-all duration-200 hover:-translate-y-0.5 cursor-pointer jobsetu-liquid-btn"
                >
                  <span>Hire Employees</span>
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </RippleContainer>
            </MagneticButton>
          </HoverSpotlightCard>
        </TiltCard3D>
      </CreativeEntrance>
    </div>
  );
};
