import React, { useState } from 'react';
import { useJobs } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase,
  IndianRupee,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  FileText,
  Building2,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import {
  Job,
  EducationLevel,
  ExperienceLevel,
  PaymentFrequency,
  EmploymentType,
  SKILL_CATEGORIES_DATA,
  BUSINESS_CATEGORIES
} from '../../types';
import { LocationPicker } from '../common/LocationPicker';

interface JobPostFormProps {
  initialJob?: Job | null;
  onSuccess: (jobId: string) => void;
  onCancel: () => void;
}

export const JobPostForm: React.FC<JobPostFormProps> = ({
  initialJob,
  onSuccess,
  onCancel
}) => {
  const { createJob, updateJob } = useJobs();
  const { employerProfile } = useAuth();

  const [title, setTitle] = useState(initialJob?.title || '');
  const [category, setCategory] = useState(initialJob?.category || 'Technical');
  const [description, setDescription] = useState(initialJob?.description || '');
  const [responsibilities, setResponsibilities] = useState(initialJob?.responsibilities || '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialJob?.requiredSkills || []);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [education, setEducation] = useState<EducationLevel>(initialJob?.education || 'Higher secondary');
  const [experience, setExperience] = useState<ExperienceLevel>(initialJob?.experience || '1–3 years');
  const [vacancies, setVacancies] = useState<number>(initialJob?.vacancies || 2);
  const [minSalary, setMinSalary] = useState<number>(initialJob?.minSalary || 18000);
  const [maxSalary, setMaxSalary] = useState<number>(initialJob?.maxSalary || 28000);
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>(
    initialJob?.paymentFrequency || 'Per month'
  );
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    initialJob?.employmentType || 'Full-time'
  );
  const [workingHours, setWorkingHours] = useState(initialJob?.workingHours || '9:00 AM - 6:00 PM');
  const [deadline, setDeadline] = useState(initialJob?.deadline || '');

  // Location state
  const [state, setState] = useState(initialJob?.state || employerProfile?.state || '');
  const [district, setDistrict] = useState(initialJob?.district || employerProfile?.district || '');
  const [city, setCity] = useState(initialJob?.city || employerProfile?.city || '');
  const [area, setArea] = useState(initialJob?.area || employerProfile?.area || '');
  const [pincode, setPincode] = useState(initialJob?.pincode || employerProfile?.pincode || '');
  const [lat, setLat] = useState<number | undefined>(initialJob?.lat ?? employerProfile?.lat);
  const [lng, setLng] = useState<number | undefined>(initialJob?.lng ?? employerProfile?.lng);

  // Benefits
  const [benefits, setBenefits] = useState<string[]>(initialJob?.benefits || ['PF & ESI', 'Overtime allowance']);
  const [benefitInput, setBenefitInput] = useState('');

  const [status, setStatus] = useState<Job['status']>(initialJob?.status || 'active');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills(prev => [...prev, trimmed]);
      setCustomSkillInput('');
    }
  };

  const addBenefit = () => {
    const trimmed = benefitInput.trim();
    if (trimmed && !benefits.includes(trimmed)) {
      setBenefits(prev => [...prev, trimmed]);
      setBenefitInput('');
    }
  };

  const removeBenefit = (b: string) => {
    setBenefits(prev => prev.filter(item => item !== b));
  };

  const handleSubmit = async (submitStatus: Job['status']) => {
    setErrorMsg(null);
    if (!title.trim()) {
      setErrorMsg('Please specify a Job Title.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please provide a job description.');
      return;
    }
    if (selectedSkills.length === 0) {
      setErrorMsg('Please select at least one required skill.');
      return;
    }
    if (minSalary > maxSalary) {
      setErrorMsg('Minimum salary cannot exceed maximum salary.');
      return;
    }

    try {
      setSubmitting(true);
      const jobPayload = {
        title: title.trim(),
        category,
        description: description.trim(),
        responsibilities: responsibilities.trim(),
        requiredSkills: selectedSkills,
        education,
        experience,
        vacancies: Number(vacancies) || 1,
        minSalary: Number(minSalary) || 0,
        maxSalary: Number(maxSalary) || 0,
        paymentFrequency,
        employmentType,
        workingHours: workingHours.trim(),
        state,
        district,
        city,
        area,
        pincode,
        lat,
        lng,
        benefits,
        deadline,
        status: submitStatus
      };

      if (initialJob?.id) {
        await updateJob(initialJob.id, jobPayload);
        onSuccess(initialJob.id);
      } else {
        const newId = await createJob(jobPayload);
        onSuccess(newId);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save job.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {initialJob ? 'Edit Job Listing' : 'Post a New Job Vacancy'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Published vacancies are immediately discoverable by verified workers across India.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100 space-y-8">
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
            <Briefcase className="w-4 h-4 text-[#F59E0B]" />
            <span>Position Details</span>
          </h2>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Electrician, Retail Cashier, Chef de Partie"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Industry Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm bg-white font-medium"
              >
                {BUSINESS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Number of Vacancies
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={vacancies}
                onChange={(e) => setVacancies(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the day-to-day work, job environment, machinery/tools used..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Responsibilities & Duties
            </label>
            <textarea
              rows={3}
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              placeholder="List specific operational duties, shift requirements, quality standards..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm"
            />
          </div>
        </div>

        {/* Section 2: Skills & Requirements */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
            <FileText className="w-4 h-4 text-[#F59E0B]" />
            <span>Required Skills & Qualifications</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Required Education
              </label>
              <select
                value={education}
                onChange={(e) => setEducation(e.target.value as EducationLevel)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm bg-white"
              >
                {[
                  'No formal education',
                  'Primary',
                  'Secondary',
                  'Higher secondary',
                  'Diploma',
                  'ITI',
                  'Undergraduate',
                  'Graduate',
                  'Postgraduate',
                  'Other'
                ].map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Experience Level
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value as ExperienceLevel)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm bg-white"
              >
                <option value="Fresher">Fresher (Zero experience required)</option>
                <option value="Less than one year">Less than 1 year</option>
                <option value="1–3 years">1–3 years</option>
                <option value="3–5 years">3–5 years</option>
                <option value="More than five years">5+ years</option>
              </select>
            </div>
          </div>

          {/* Skills Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Select Skills for this Role <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 rounded-2xl bg-gray-50 border border-gray-200">
              {(SKILL_CATEGORIES_DATA[category] || SKILL_CATEGORIES_DATA['Technical'] || []).map((sk) => {
                const isSelected = selectedSkills.includes(sk);
                return (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => toggleSkill(sk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#F59E0B] text-white shadow-xs'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-[#F59E0B]'
                    }`}
                  >
                    {isSelected ? `✓ ${sk}` : `+ ${sk}`}
                  </button>
                );
              })}
            </div>

            {/* Custom Skill Input */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                placeholder="Add other required skill..."
                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs outline-none"
              />
              <button
                type="button"
                onClick={addCustomSkill}
                className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold"
              >
                + Add
              </button>
            </div>

            {/* Selected Skills Badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedSkills.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-[#2563EB]"
                >
                  {sk}
                  <button type="button" onClick={() => toggleSkill(sk)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Salary & Work Timing */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
            <IndianRupee className="w-4 h-4 text-[#F59E0B]" />
            <span>Compensation & Shifts</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Minimum Salary (INR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step={500}
                value={minSalary}
                onChange={(e) => setMinSalary(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Maximum Salary (INR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step={500}
                value={maxSalary}
                onChange={(e) => setMaxSalary(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Payment Frequency
              </label>
              <select
                value={paymentFrequency}
                onChange={(e) => setPaymentFrequency(e.target.value as PaymentFrequency)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm bg-white font-medium"
              >
                <option value="Per hour">Per hour</option>
                <option value="Per day">Per day</option>
                <option value="Per week">Per week</option>
                <option value="Per month">Per month</option>
                <option value="Negotiable">Negotiable</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm bg-white"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Temporary">Temporary</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Working Hours / Shift
              </label>
              <input
                type="text"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                placeholder="e.g. 9:00 AM - 6:00 PM (Rotational shifts)"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#F59E0B] outline-none text-sm"
              />
            </div>
          </div>

          {/* Benefits */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Workplace Benefits & Perks
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                placeholder="e.g. Free meals, Overtime, Travel allowance, Health insurance"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs outline-none"
              />
              <button
                type="button"
                onClick={addBenefit}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold"
              >
                Add Benefit
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {benefits.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800"
                >
                  <span>{b}</span>
                  <button type="button" onClick={() => removeBenefit(b)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Workplace Location (Interactive Map & Geolocation) */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
            <MapPin className="w-4 h-4 text-[#F59E0B]" />
            <span>Workplace Location (Map & 50km Discovery)</span>
          </h2>

          <LocationPicker
            state={state}
            setState={setState}
            district={district}
            setDistrict={setDistrict}
            city={city}
            setCity={setCity}
            area={area}
            setArea={setArea}
            pincode={pincode}
            setPincode={setPincode}
            lat={lat}
            lng={lng}
            onCoordinatesChange={(newLat, newLng) => {
              setLat(newLat);
              setLng(newLng);
            }}
          />
        </div>

        {/* Actions Buttons */}
        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="w-full sm:w-auto py-3 px-6 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('draft')}
              className="flex-1 sm:flex-none py-3 px-6 rounded-xl border-2 border-gray-300 hover:border-gray-400 text-gray-800 text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              Save Draft
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('active')}
              className="flex-1 sm:flex-none py-3 px-7 rounded-xl bg-[#F59E0B] hover:bg-amber-600 text-white text-sm font-bold shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Publishing...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{initialJob ? 'Update & Publish' : 'Publish Job Listing'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
