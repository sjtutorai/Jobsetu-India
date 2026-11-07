import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  FileText,
  Briefcase,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Copy,
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobContext';
import { Job, WorkerProfile } from '../../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTask?: 'recommend_jobs' | 'improve_resume' | 'improve_job_description' | 'suggest_skills' | 'recruitment_ad' | 'general';
  activeJobContext?: Job;
}

interface AIMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  defaultTask = 'general',
  activeJobContext
}) => {
  const { userProfile, workerProfile, employerProfile } = useAuth();
  const { jobs } = useJobs();

  const [activeTask, setActiveTask] = useState<'recommend_jobs' | 'improve_resume' | 'improve_job_description' | 'suggest_skills' | 'recruitment_ad' | 'general'>(defaultTask);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      sender: 'assistant',
      text: `Namaste! I am your JOBSETU AI Employment Assistant. 🌟\n\nHow can I support you today?\n• Recommend top matching jobs for your profile\n• Help build and polish your vocational resume\n• Improve job descriptions or write recruitment ads\n• Suggest high-demand skills for the Indian job market\n• Answer any questions about employment, labor norms, or navigating JOBSETU.`,
      timestamp: 'Just now'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const isEmployer = userProfile?.activeRole === 'employer';

  const handleQuickAction = async (task: 'recommend_jobs' | 'improve_resume' | 'improve_job_description' | 'suggest_skills' | 'recruitment_ad' | 'general', label: string) => {
    setActiveTask(task);
    await executeAIQuery(task, label);
  };

  const executeAIQuery = async (task: string, promptText: string) => {
    const userMsg: AIMessage = {
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const payload: any = {
        task,
        prompt: promptText,
        context: {
          workerProfile: workerProfile || null,
          employerProfile: employerProfile || null,
          availableJobs: jobs.slice(0, 10),
          job: activeJobContext || (jobs.length > 0 ? jobs[0] : null)
        }
      };

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const assistantMsg: AIMessage = {
        sender: 'assistant',
        text: data.result || 'Here is your guidance.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: AIMessage = {
        sender: 'assistant',
        text: `Error connecting to AI service: ${err.message || 'Please check your connection and try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || loading) return;
    executeAIQuery(activeTask, inputPrompt.trim());
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[650px] max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">JOBSETU AI Assistant</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-400 text-gray-900">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-blue-100">Smart Job Matching • Resume Builder • Ad Copywriter</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Chips */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-gray-100 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          {!isEmployer ? (
            <>
              <button
                type="button"
                onClick={() => handleQuickAction('recommend_jobs', 'Recommend the best matching jobs for my profile')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-100 hover:bg-blue-200 text-[#2563EB] flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Recommend Suitable Jobs</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAction('improve_resume', 'Help me craft an impressive vocational resume summary and skills')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generate Professional Resume</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAction('suggest_skills', 'What skills are in highest demand for my career field?')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-800 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Suggest High-Demand Skills</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleQuickAction('improve_job_description', 'Optimize and elevate our job description for candidate appeal')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-100 hover:bg-blue-200 text-[#2563EB] flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Improve Job Description</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAction('recruitment_ad', 'Write a high-converting recruitment ad for WhatsApp and social posters')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Write Hiring Ad Copy</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAction('suggest_skills', 'Suggest required competencies and evaluation criteria for this role')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-800 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Suggest Skills & Criteria</span>
              </button>
            </>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/40">
          {messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={index}
                className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser ? 'bg-[#2563EB] text-white' : 'bg-amber-500 text-white shadow-xs'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div
                  className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-[#2563EB] text-white rounded-tr-none shadow-md shadow-blue-500/10'
                      : 'bg-white text-gray-800 border border-gray-200/80 rounded-tl-none shadow-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.text, index)}
                        className="text-gray-500 hover:text-gray-700 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedIndex === index ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy response</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 mr-auto max-w-[80%]">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-3xl bg-white border border-gray-200 text-xs text-gray-600 rounded-tl-none flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" />
                <span>Consulting Gemini intelligence...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-4 bg-white border-t border-gray-200 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={
              !isEmployer
                ? 'Ask for resume tips, suitable jobs, interview advice...'
                : 'Ask to write job ad, refine requirements, salary benchmarks...'
            }
            className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm outline-none transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !inputPrompt.trim()}
            className="px-5 py-2.5 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>
      </div>
    </div>
  );
};
