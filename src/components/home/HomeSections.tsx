import React from 'react';
import { SKILL_CATEGORIES_DATA } from '../../types';
import {
  ScrollTriggeredZoom,
  StaggeredCardContainer,
  StaggeredCardItem,
  NumberCounter,
  AnimatedProgressBar,
  CreativeEntrance,
  TiltCard3D,
  HoverSpotlightCard,
  WaveText,
  HorizontalMaskText,
  ScrollTextTransform,
  AnimatedSVGDrawLine,
  RippleContainer,
  SectionMorphTransition,
  Rotate3DText,
  ElasticText,
  CharacterDropText,
  ParallaxScrollLayer
} from '../animations';

export const StatsSection: React.FC = () => {
  return (
    <section className="py-12 bg-white border-y border-gray-100 overflow-hidden">
      <ScrollTriggeredZoom>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggeredCardContainer className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StaggeredCardItem>
              <HoverSpotlightCard className="p-4 rounded-2xl">
                <p className="text-3xl sm:text-4xl font-extrabold text-[#2563EB] tracking-tight">
                  <NumberCounter value={36} />
                </p>
                <p className="text-xs sm:text-sm font-semibold text-gray-800 mt-1">States & Union Territories</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Pan-India coverage</p>
                <div className="mt-3 max-w-[110px] mx-auto">
                  <AnimatedProgressBar percent={100} trackClassName="w-full bg-blue-100 h-1 rounded-full overflow-hidden" barClassName="bg-[#2563EB] h-full rounded-full" />
                </div>
              </HoverSpotlightCard>
            </StaggeredCardItem>

            <StaggeredCardItem>
              <HoverSpotlightCard spotlightColor="rgba(245, 158, 11, 0.1)" className="p-4 rounded-2xl">
                <p className="text-3xl sm:text-4xl font-extrabold text-[#F59E0B] tracking-tight">
                  <NumberCounter value={8} suffix="+" />
                </p>
                <p className="text-xs sm:text-sm font-semibold text-gray-800 mt-1">Vocational Sectors</p>
                <p className="text-[11px] text-gray-500 mt-0.5">From Retail to Technical & Digital</p>
                <div className="mt-3 max-w-[110px] mx-auto">
                  <AnimatedProgressBar percent={85} trackClassName="w-full bg-amber-100 h-1 rounded-full overflow-hidden" barClassName="bg-[#F59E0B] h-full rounded-full" />
                </div>
              </HoverSpotlightCard>
            </StaggeredCardItem>

            <StaggeredCardItem>
              <HoverSpotlightCard className="p-4 rounded-2xl">
                <p className="text-3xl sm:text-4xl font-extrabold text-[#2563EB] tracking-tight">
                  <NumberCounter value={100} suffix="%" />
                </p>
                <p className="text-xs sm:text-sm font-semibold text-gray-800 mt-1">Verified Employers</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Strict compliance checks</p>
                <div className="mt-3 max-w-[110px] mx-auto">
                  <AnimatedProgressBar percent={100} trackClassName="w-full bg-blue-100 h-1 rounded-full overflow-hidden" barClassName="bg-[#2563EB] h-full rounded-full" />
                </div>
              </HoverSpotlightCard>
            </StaggeredCardItem>

            <StaggeredCardItem>
              <HoverSpotlightCard spotlightColor="rgba(16, 185, 129, 0.1)" className="p-4 rounded-2xl">
                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight">
                  <NumberCounter value={0} prefix="₹" />
                </p>
                <p className="text-xs sm:text-sm font-semibold text-gray-800 mt-1">Worker Placement Fee</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Free for all job seekers</p>
                <div className="mt-3 max-w-[110px] mx-auto">
                  <AnimatedProgressBar percent={100} trackClassName="w-full bg-emerald-100 h-1 rounded-full overflow-hidden" barClassName="bg-emerald-600 h-full rounded-full" />
                </div>
              </HoverSpotlightCard>
            </StaggeredCardItem>
          </StaggeredCardContainer>
        </div>
      </ScrollTriggeredZoom>
    </section>
  );
};

export const HowItWorksSection: React.FC<{ onSelectRole: (role: 'worker' | 'employer') => void }> = ({ onSelectRole }) => {
  return (
    <section className="py-20 bg-slate-50/70 relative overflow-hidden" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollTextTransform>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-block">
              <ElasticText text="Simple & Transparent" />
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] mt-3 tracking-tight">
              <HorizontalMaskText text="How JOBSETU Connects India" />
            </h2>
            <p className="text-gray-600 text-base mt-3">
              Designed for speed, clarity, and trust. Get started in minutes whether you are looking for your next job or hiring talented employees.
            </p>
            <AnimatedSVGDrawLine className="w-48 h-4 mx-auto mt-4" />
          </div>
        </ScrollTextTransform>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* For Job Seekers */}
          <CreativeEntrance variant="diagonal" delay={0.1}>
            <TiltCard3D maxTilt={4} className="h-full">
              <HoverSpotlightCard className="bg-white p-8 rounded-3xl border border-blue-100 shadow-lg shadow-blue-500/5 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold jobsetu-float-3d">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      <WaveText text="For Job Seekers" />
                    </h3>
                    <p className="text-xs text-gray-500">Your pathway to steady livelihood</p>
                  </div>
                </div>

                <StaggeredCardContainer className="space-y-6">
                  <StaggeredCardItem className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      A
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Create Unified Profile</h4>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        Enter basic details, state, district, and PIN code. 18+ eligibility verified.
                      </p>
                    </div>
                  </StaggeredCardItem>

                  <StaggeredCardItem className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      B
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Select Vocational & Digital Skills</h4>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        Choose from Retail, Hospitality, Technical, Transport, Office, Digital, or custom skills.
                      </p>
                    </div>
                  </StaggeredCardItem>

                  <StaggeredCardItem className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      C
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Connect with Verified Employers</h4>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        Employers can view your profile and reach out directly with job opportunities.
                      </p>
                    </div>
                  </StaggeredCardItem>
                </StaggeredCardContainer>

                <RippleContainer className="w-full rounded-xl mt-8">
                  <button
                    onClick={() => onSelectRole('worker')}
                    className="w-full py-3 px-4 rounded-xl bg-blue-50 text-[#2563EB] hover:bg-[#2563EB] hover:text-white font-bold text-sm transition-all cursor-pointer jobsetu-liquid-btn"
                  >
                    Start as Job Seeker →
                  </button>
                </RippleContainer>
              </HoverSpotlightCard>
            </TiltCard3D>
          </CreativeEntrance>

          {/* For Employers */}
          <CreativeEntrance variant="perspectiveSlide" delay={0.18}>
            <TiltCard3D maxTilt={4} className="h-full">
              <HoverSpotlightCard spotlightColor="rgba(245, 158, 11, 0.08)" className="bg-white p-8 rounded-3xl border border-amber-100 shadow-lg shadow-amber-500/5 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center font-bold jobsetu-float-3d">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      <WaveText text="For Employers" delay={0.1} />
                    </h3>
                    <p className="text-xs text-gray-500">Hire certified and motivated staff</p>
                  </div>
                </div>

                <StaggeredCardContainer className="space-y-6">
                  <StaggeredCardItem className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      A
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Register Your Business</h4>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        Add owner details, company category, location address, and trade information.
                      </p>
                    </div>
                  </StaggeredCardItem>

                  <StaggeredCardItem className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      B
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Submit Verification Info</h4>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        Provide GST/PAN/Shop registration info. Transparent audit protects job seekers.
                      </p>
                    </div>
                  </StaggeredCardItem>

                  <StaggeredCardItem className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      C
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Recruit Suitable Candidates</h4>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        Find skilled candidates matching your business category and exact pin code.
                      </p>
                    </div>
                  </StaggeredCardItem>
                </StaggeredCardContainer>

                <RippleContainer className="w-full rounded-xl mt-8">
                  <button
                    onClick={() => onSelectRole('employer')}
                    className="w-full py-3 px-4 rounded-xl bg-amber-50 text-amber-700 hover:bg-[#F59E0B] hover:text-white font-bold text-sm transition-all cursor-pointer jobsetu-liquid-btn"
                  >
                    Start as Employer →
                  </button>
                </RippleContainer>
              </HoverSpotlightCard>
            </TiltCard3D>
          </CreativeEntrance>
        </div>
      </div>
    </section>
  );
};

export const SkillCategoriesShowcase: React.FC = () => {
  const categories = Object.keys(SKILL_CATEGORIES_DATA);

  return (
    <section className="py-20 bg-white overflow-hidden">
      <SectionMorphTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ParallaxScrollLayer speed={14}>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B] bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block">
                <CharacterDropText text="Vocational & Professional Diversity" />
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] mt-3 tracking-tight">
                <Rotate3DText text="Popular Skill Categories" />
              </h2>
              <p className="text-gray-600 text-sm sm:text-base mt-2">
                Tailored for grassroots workers, technical technicians, administrative staff, and creative specialists.
              </p>
            </div>
          </ParallaxScrollLayer>

          <StaggeredCardContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.07}>
            {categories.map((cat, index) => {
              const skills = SKILL_CATEGORIES_DATA[cat] || [];
              const cardVariants = ['spiral', 'spring', 'scaleRotate', 'flipCard'] as const;
              const variant = cardVariants[index % cardVariants.length];

              return (
                <StaggeredCardItem key={cat}>
                  <CreativeEntrance variant={variant} delay={index * 0.04} className="h-full">
                    <TiltCard3D maxTilt={5} className="h-full">
                      <HoverSpotlightCard className="p-6 rounded-2xl bg-slate-50 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group h-full">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-gray-900 text-base group-hover:text-[#2563EB] transition-colors">
                            {cat}
                          </h3>
                          <span className="text-[10px] font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-full border">
                            {skills.length} skills
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {skills.slice(0, 4).map((s) => (
                            <span
                              key={s}
                              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700"
                            >
                              {s}
                            </span>
                          ))}
                          {skills.length > 4 && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-[#2563EB]">
                              +{skills.length - 4} more
                            </span>
                          )}
                        </div>
                      </HoverSpotlightCard>
                    </TiltCard3D>
                  </CreativeEntrance>
                </StaggeredCardItem>
              );
            })}
          </StaggeredCardContainer>
        </div>
      </SectionMorphTransition>
    </section>
  );
};
