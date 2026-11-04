/**
 * Export Dialog Component.
 * Exports worksheets to Plain Text, HTML, or LaTeX with copy and download options.
 */

import React, { useState } from 'react';
import { EvaluationResponse } from '../engine/api';
import { X, Copy, Download, Check } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  content: string;
  results: EvaluationResponse[];
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  documentTitle,
  content,
  results,
}) => {
  const [format, setFormat] = useState<'text' | 'html' | 'latex'>('text');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const lines = content.split('\n');

  const generateExport = (): string => {
    if (format === 'text') {
      const formattedLines = lines.map((line, idx) => {
        const res = results[idx];
        const resText = res && res.kind !== 'silent' ? ` // => ${res.display}` : '';
        return `${line}${resText}`;
      });
      return formattedLines.join('\n');
    }

    if (format === 'html') {
      const rows = lines
        .map((line, idx) => {
          const res = results[idx];
          const resDisplay = res && res.kind !== 'silent' ? res.display : '';
          return `  <tr><td class="expr">${line}</td><td class="res">${resDisplay}</td></tr>`;
        })
        .join('\n');

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${documentTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; padding: 20px; }
    table { width: 100%; border-collapse: collapse; font-family: monospace; font-size: 14px; }
    td { padding: 4px 8px; border-bottom: 1px solid #e2e8f0; }
    .expr { color: #1e293b; }
    .res { text-align: right; color: #059669; font-weight: 600; }
  </style>
</head>
<body>
  <h2>${documentTitle}</h2>
  <table>
${rows}
  </table>
</body>
</html>`;
    }

    if (format === 'latex') {
      // PhyxCalc legacy LaTeX export: format variables e.g. radius -> r_{adius}
      const latexLines = lines
        .map((line, idx) => {
          const res = results[idx];
          if (!line.trim()) return '';
          let l = line.replace(/([a-zA-Z])([a-zA-Z0-9]+)/g, '$1_{$2}');
          l = l.replace(/\*/g, ' \\cdot ');
          l = l.replace(/\^2/g, '^2');
          l = l.replace(/pi/g, '\\pi');
          const resDisplay = res && res.kind !== 'silent' ? ` & = ${res.display}` : '';
          return `${l}${resDisplay} \\\\`;
        })
        .filter(Boolean)
        .join('\n');

      return `\\documentclass{article}
\\usepackage{amsmath}
\\begin{document}
\\section*{${documentTitle}}
\\begin{align*}
${latexLines}
\\end{align*}
\\end{document}`;
    }

    return '';
  };

  const exportText = generateExport();

  const handleCopy = () => {
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = format === 'text' ? 'txt' : format === 'html' ? 'html' : 'tex';
    const mime =
      format === 'text'
        ? 'text/plain'
        : format === 'html'
        ? 'text/html'
        : 'application/x-latex';
    const blob = new Blob([exportText], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-2xl h-[520px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            Export Calculation
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex gap-2">
            <button
              onClick={() => setFormat('text')}
              className={`px-3 py-1 rounded font-medium ${
                format === 'text'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Plain Text
            </button>
            <button
              onClick={() => setFormat('html')}
              className={`px-3 py-1 rounded font-medium ${
                format === 'html'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              HTML Document
            </button>
            <button
              onClick={() => setFormat('latex')}
              className={`px-3 py-1 rounded font-medium ${
                format === 'latex'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              LaTeX
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              <Download size={13} />
              Download
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-3 overflow-hidden bg-slate-50 dark:bg-slate-950">
          <textarea
            readOnly
            value={exportText}
            className="w-full h-full p-2.5 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded resize-none outline-none"
          />
        </div>
      </div>
    </div>
  );
};
