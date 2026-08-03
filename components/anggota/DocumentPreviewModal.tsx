'use client';

import React from 'react';
import { X, ExternalLink, FileText, Download, Image as ImageIcon } from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  title,
  url,
}: DocumentPreviewModalProps) {
  if (!isOpen || !url) return null;

  // Convert Google Drive view URL to preview/embed URL if applicable
  let embedUrl = url;
  if (url.includes('drive.google.com/file/d/')) {
    embedUrl = url.replace('/view', '/preview');
  }

  const isImage = url.match(/\.(jpeg|jpg|gif|png)$/i);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-all"
            >
              <span>Buka di Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div className="flex-1 bg-slate-950 p-4 flex items-center justify-center overflow-auto">
          {isImage ? (
            <img src={url} alt={title} className="max-h-full max-w-full object-contain rounded-xl shadow-md" />
          ) : (
            <iframe
              src={embedUrl}
              className="w-full h-full rounded-xl border border-slate-800"
              title={title}
            />
          )}
        </div>
      </div>
    </div>
  );
}
