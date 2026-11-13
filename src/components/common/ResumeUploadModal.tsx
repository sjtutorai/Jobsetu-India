import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Trash2, Eye } from 'lucide-react';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentResumeUrl?: string;
  currentResumeName?: string;
  onSave: (resumeUrl: string, resumeName: string) => Promise<void>;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  currentResumeUrl,
  currentResumeName,
  onSave
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState(currentResumeName || '');
  const [fileDataUrl, setFileDataUrl] = useState<string>(currentResumeUrl || '');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Check size limit (max 650KB for reliable Firestore base64 storage)
    if (selected.size > 650 * 1024) {
      setErrorMsg('File size must be under 650 KB for fast verification & cloud saving.');
      return;
    }

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(selected.type) && !selected.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      setErrorMsg('Please upload a PDF, Word document (DOC/DOCX), or Text file.');
      return;
    }

    setFile(selected);
    setFileName(selected.name);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileDataUrl(reader.result);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the file.');
    };
    reader.readAsDataURL(selected);
  };

  const handleSave = async () => {
    if (!fileDataUrl) {
      setErrorMsg('Please select a resume file to upload.');
      return;
    }
    try {
      setSaving(true);
      setErrorMsg(null);
      await onSave(fileDataUrl, fileName || 'Resume.pdf');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save resume.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setFileName('');
    setFileDataUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Upload Resume / CV</h3>
              <p className="text-xs text-gray-500">Supported formats: PDF, DOCX (Max 650KB)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-gray-600 flex items-center justify-center shadow-xs transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {fileDataUrl ? (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-[#2563EB]" />
                <div>
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">{fileName || 'Attached Resume'}</p>
                  <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready for job applications
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-2 rounded-xl text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-[#2563EB] rounded-3xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30 flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center mb-1">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-gray-800">
                Click to browse or drop resume here
              </p>
              <p className="text-xs text-gray-500">
                Upload your verified CV to allow verified employers to review your full background
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <span className="font-bold">Privacy Guard:</span> Your resume is only shared with verified employers when you apply for a job or grant explicit permission.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !fileDataUrl}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-blue-700 text-white shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {saving ? 'Saving...' : 'Save Resume'}
          </button>
        </div>
      </div>
    </div>
  );
};
