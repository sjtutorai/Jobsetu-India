import React from 'react';
import { RoleCards } from './RoleCards';
import { UserRole } from '../../types';
import { ShieldCheck, MapPin, Zap, Navigation } from 'lucide-react';
import {
  HeroAmbientBackdrop,
  SplitTextReveal,
  PerspectiveRevealText,
  WordStagger,
  FlipText,
  BlurRevealText,
  CreativeEntrance,
  MagneticButton,
  RippleContainer,
  RippleRadarPulse,
  StaggeredCardContainer,
  StaggeredCardItem,
  HoverSpotlightCard,
  ScrollDrivenRotation
} from '../animations';

interface HeroProps {
  onSelectRole: (role: UserRole) => void;
  onOpen50KmRadius?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onSelectRole, onOpen50KmRadius }) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-blue-50/60 via-white to-gray-50/50 jobsetu-animated-gradient">
      {/* Ambient Aurora, Moving Grid, Particles, Gradient Orbs, Blobs, Geometric Shapes & Shooting Stars */}
      <HeroAmbientBackdrop />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        {/* Top Bharat connectivity pill */}
        <CreativeEntrance variant="dropTop" delay={0.05}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-xs border border-blue-200 shadow-xs mb-8 jobsetu-glow-border">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-[#111827]">
              Empowering All 28 States & 8 Union Territories
            </span>
            <span className="text-xs text-[#F59E0B] font-semibold">🇮🇳 Pan-India</span>
          </div>
        </CreativeEntrance>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#111827] tracking-tight uppercase max-w-4xl leading-[1.1] mb-6">
          <SplitTextReveal text="WELCOME TO " />
          <span className="text-[#2563EB] inline-block jobsetu-glitch-once">
            <PerspectiveRevealText text="JOBSETU" delay={0.22} />
          </span>
        </h1>

        {/* Subtitle */}
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#111827] mb-5 tracking-tight">
          <WordStagger text="Find Opportunities." delay={0.28} />{' '}
          <span className="text-[#F59E0B]">
            <FlipText text="Hire the Right People." delay={0.42} />
          </span>
        </h2>

        {/* Description */}
        <p className="text-base sm:text-lg lg:text-xl text-[#6B7280] max-w-3xl leading-relaxed mb-8">
          <BlurRevealText
            text="JOBSETU connects job seekers with employers across India. Discover opportunities or find suitable employees for your business."
            delay={0.48}
          />
        </p>

        {/* Prominent 50 KM Radius Quick Action Button */}
        {onOpen50KmRadius && (
          <CreativeEntrance variant="elasticBounce" delay={0.55} className="mb-10">
            <MagneticButton>
              <RippleContainer className="rounded-2xl">
                <button
                  type="button"
                  onClick={onOpen50KmRadius}
                  className="relative inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5 cursor-pointer jobsetu-liquid-btn"
                >
                  <span className="relative flex items-center justify-center">
                    <RippleRadarPulse colorClass="border-white/50" />
                    <Navigation className="w-4 h-4 relative z-10" />
                  </span>
                  <span>Explore 50 KM Radius — Find Jobs & Workers Near Me</span>
                </button>
              </RippleContainer>
            </MagneticButton>
          </CreativeEntrance>
        )}

        {/* The Two Large Prominent Cards */}
        <RoleCards onSelectRole={onSelectRole} />

        {/* Trust Badges */}
        <StaggeredCardContainer className="mt-14 pt-8 border-t border-gray-200/80 w-full max-w-4xl grid grid-cols-2 md:grid-cols-3 gap-6 text-left">
          <StaggeredCardItem>
            <HoverSpotlightCard className="rounded-2xl p-2 -m-2">
              <div className="flex items-center gap-3">
                <ScrollDrivenRotation degrees={36}>
                  <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-[#2563EB] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </ScrollDrivenRotation>
                <div>
                  <p className="text-xs font-bold text-gray-900">Direct Connection</p>
                  <p className="text-[11px] text-gray-500">No middle agents or placement cuts</p>
                </div>
              </div>
            </HoverSpotlightCard>
          </StaggeredCardItem>

          <StaggeredCardItem>
            <HoverSpotlightCard className="rounded-2xl p-2 -m-2">
              <div className="flex items-center gap-3">
                <ScrollDrivenRotation degrees={-36}>
                  <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-[#F59E0B] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                </ScrollDrivenRotation>
                <div>
                  <p className="text-xs font-bold text-gray-900">50 KM Hyperlocal Radar</p>
                  <p className="text-[11px] text-gray-500">Live GPS distance within 50 KM radius</p>
                </div>
              </div>
            </HoverSpotlightCard>
          </StaggeredCardItem>

          <StaggeredCardItem className="col-span-2 md:col-span-1">
            <HoverSpotlightCard className="rounded-2xl p-2 -m-2">
              <div className="flex items-center gap-3">
                <ScrollDrivenRotation degrees={45}>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                </ScrollDrivenRotation>
                <div>
                  <p className="text-xs font-bold text-gray-900">Unified Account</p>
                  <p className="text-[11px] text-gray-500">Switch between Seeker & Employer</p>
                </div>
              </div>
            </HoverSpotlightCard>
          </StaggeredCardItem>
        </StaggeredCardContainer>
      </div>
    </section>
  );
};
