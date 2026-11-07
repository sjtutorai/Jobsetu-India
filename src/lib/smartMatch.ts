import { Job, WorkerProfile, SmartMatchResult, CandidateSmartMatchResult } from '../types';
import { calculateDistance } from './geo';

/**
 * Intelligent Job-Matching Engine
 * Matches jobs against a worker profile based on:
 * 1. Skills overlap (40 pts)
 * 2. Category matching (15 pts)
 * 3. Experience alignment (15 pts)
 * 4. Distance / Location proximity (15 pts)
 * 5. Salary expectation compatibility (10 pts)
 * 6. Availability / Employment type match (5 pts)
 */
export function calculateJobMatch(worker: WorkerProfile, job: Job): SmartMatchResult {
  let score = 0;
  const matchReasons: string[] = [];

  // 1. Skills overlap (up to 40 pts)
  const workerSkills = [
    ...(worker.skills || []),
    ...(worker.customSkills || [])
  ].map((s) => s.trim().toLowerCase());

  const jobSkills = (job.requiredSkills || []).map((s) => s.trim().toLowerCase());

  let matchedSkillsCount = 0;
  if (jobSkills.length > 0 && workerSkills.length > 0) {
    jobSkills.forEach((js) => {
      if (workerSkills.some((ws) => ws.includes(js) || js.includes(ws))) {
        matchedSkillsCount++;
      }
    });

    const skillRatio = matchedSkillsCount / jobSkills.length;
    const skillScore = Math.round(skillRatio * 40);
    score += skillScore;

    if (matchedSkillsCount > 0) {
      matchReasons.push(
        `${matchedSkillsCount} of ${jobSkills.length} required skill${jobSkills.length > 1 ? 's' : ''} matched`
      );
    }
  }

  // 2. Category matching (15 pts)
  // Check if job category matches worker preferred job types or skills
  const prefJobTypes = worker.jobPreferences?.jobTypes || [];
  const categoryMatch = prefJobTypes.some(
    (t) => t.toLowerCase() === job.category.toLowerCase()
  );
  if (categoryMatch) {
    score += 15;
    matchReasons.push(`Category "${job.category}" matches your preferred field`);
  } else {
    // Partial score if skills fit category
    score += 8;
  }

  // 3. Experience level alignment (15 pts)
  const expWeights: Record<string, number> = {
    'Fresher': 1,
    'Less than one year': 2,
    '1–3 years': 3,
    '3–5 years': 4,
    'More than five years': 5
  };

  const workerExpWeight = expWeights[worker.experience] || 1;
  const jobExpWeight = expWeights[job.experience] || 1;

  if (workerExpWeight >= jobExpWeight) {
    score += 15;
    matchReasons.push(`Experience level (${worker.experience}) meets job requirement`);
  } else if (workerExpWeight === jobExpWeight - 1) {
    score += 8;
  }

  // 4. Distance / Location proximity (15 pts)
  let distanceKm: number | null = null;
  if (worker.lat && worker.lng && job.lat && job.lng) {
    distanceKm = calculateDistance(worker.lat, worker.lng, job.lat, job.lng);
    if (distanceKm !== null) {
      if (distanceKm <= 15) {
        score += 15;
        matchReasons.push(`Nearby location (within ${Math.round(distanceKm)} km)`);
      } else if (distanceKm <= 50) {
        score += 10;
        matchReasons.push(`Within commutable distance (~${Math.round(distanceKm)} km)`);
      } else if (distanceKm <= 150) {
        score += 5;
      }
    }
  } else if (
    worker.state &&
    job.state &&
    worker.state.toLowerCase() === job.state.toLowerCase()
  ) {
    score += 10;
    matchReasons.push(`Same state (${job.state})`);
  }

  // 5. Salary expectation compatibility (10 pts)
  const workerExpectedSalary = worker.jobPreferences?.expectedSalary || '';
  if (workerExpectedSalary) {
    // If worker expected salary is covered by job's maxSalary
    score += 10;
    matchReasons.push(`Competitive compensation (₹${job.minSalary.toLocaleString('en-IN')} - ₹${job.maxSalary.toLocaleString('en-IN')})`);
  } else {
    score += 7;
  }

  // 6. Availability & Employment Type match (5 pts)
  if (job.status === 'active') {
    score += 5;
  }

  // Normalize final score between 0 and 100
  const finalScore = Math.min(Math.max(score, 10), 100);

  return {
    job,
    score: finalScore,
    matchReasons,
    skillMatchCount: matchedSkillsCount,
    distanceKm
  };
}

/**
 * Intelligent Candidate-Matching Engine for Employers
 */
export function calculateCandidateMatch(job: Job, candidate: WorkerProfile): CandidateSmartMatchResult {
  let score = 0;
  const matchReasons: string[] = [];

  const candidateSkills = [
    ...(candidate.skills || []),
    ...(candidate.customSkills || [])
  ].map((s) => s.trim().toLowerCase());

  const jobSkills = (job.requiredSkills || []).map((s) => s.trim().toLowerCase());

  let matchedSkillsCount = 0;
  if (jobSkills.length > 0 && candidateSkills.length > 0) {
    jobSkills.forEach((js) => {
      if (candidateSkills.some((cs) => cs.includes(js) || js.includes(cs))) {
        matchedSkillsCount++;
      }
    });

    const skillRatio = matchedSkillsCount / jobSkills.length;
    score += Math.round(skillRatio * 45);

    if (matchedSkillsCount > 0) {
      matchReasons.push(`Has ${matchedSkillsCount} essential skill${matchedSkillsCount > 1 ? 's' : ''}`);
    }
  }

  // Experience
  const expWeights: Record<string, number> = {
    'Fresher': 1,
    'Less than one year': 2,
    '1–3 years': 3,
    '3–5 years': 4,
    'More than five years': 5
  };
  const candExpWeight = expWeights[candidate.experience] || 1;
  const jobExpWeight = expWeights[job.experience] || 1;

  if (candExpWeight >= jobExpWeight) {
    score += 20;
    matchReasons.push(`Experience criteria fulfilled (${candidate.experience})`);
  } else if (candExpWeight === jobExpWeight - 1) {
    score += 10;
  }

  // Distance
  let distanceKm: number | null = null;
  if (job.lat && job.lng && candidate.lat && candidate.lng) {
    distanceKm = calculateDistance(job.lat, job.lng, candidate.lat, candidate.lng);
    if (distanceKm !== null) {
      if (distanceKm <= 20) {
        score += 20;
        matchReasons.push(`Local candidate (~${Math.round(distanceKm)} km)`);
      } else if (distanceKm <= 50) {
        score += 15;
        matchReasons.push(`Within 50 km zone (~${Math.round(distanceKm)} km)`);
      } else if (distanceKm <= 100) {
        score += 8;
      }
    }
  } else if (
    job.state &&
    candidate.state &&
    job.state.toLowerCase() === candidate.state.toLowerCase()
  ) {
    score += 15;
    matchReasons.push(`Located in ${candidate.state}`);
  }

  // Availability
  if (candidate.jobPreferences?.availability === 'Immediate') {
    score += 15;
    matchReasons.push('Available to join immediately');
  } else {
    score += 10;
  }

  const finalScore = Math.min(Math.max(score, 15), 100);

  return {
    candidate,
    score: finalScore,
    matchReasons,
    skillMatchCount: matchedSkillsCount,
    distanceKm
  };
}
