/**
 * WorksheetEditor Component.
 * Integrates CodeMirror 6 with custom syntax highlighting, error diagnostics,
 * and synchronized line-by-line result display.
 */

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, highlightActiveLine, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { autocompletion } from '@codemirror/autocomplete';
import { setDiagnostics } from '@codemirror/lint';
import { phyxcalcLanguage } from './phyxcalc-mode';
import { createPhyxcalcAutocomplete } from './phyxcalc-autocomplete';
import { EvaluationResponse } from '../engine/api';

export interface WorksheetEditorRef {
  insertText: (text: string) => void;
  getContent: () => string;
  setContent: (content: string) => void;
}

interface WorksheetEditorProps {
  content: string;
  results: EvaluationResponse[];
  onChange: (content: string) => void;
  onEvaluate?: () => void;
  getVariableNames?: () => string[];
  autoSuperscripts?: boolean;
}

export const WorksheetEditor = forwardRef<WorksheetEditorRef, WorksheetEditorProps>(
  (
    {
      content,
      results,
      onChange,
      onEvaluate,
      getVariableNames,
      autoSuperscripts = true,
    },
    ref
  ) => {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const resultsContainerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      insertText(text: string) {
        if (!viewRef.current) return;
        const view = viewRef.current;
        const selection = view.state.selection.main;
        view.dispatch({
          changes: { from: selection.from, to: selection.to, insert: text },
          selection: { anchor: selection.from + text.length },
        });
        view.focus();
      },
      getContent() {
        return viewRef.current ? viewRef.current.state.doc.toString() : content;
      },
      setContent(newContent: string) {
        if (!viewRef.current) return;
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: viewRef.current.state.doc.length,
            insert: newContent,
          },
        });
      },
    }));

    // Initialize CodeMirror Editor
    useEffect(() => {
      if (!editorContainerRef.current) return;

      const autocompleteExtension = autocompletion({
        override: [createPhyxcalcAutocomplete(getVariableNames)],
      });

      const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const docStr = update.state.doc.toString();
          onChange(docStr);

          // Handle automatic superscript conversion: ^2 -> ², ^3 -> ³
          if (autoSuperscripts) {
            update.changes.iterChanges((_fromA, _toA, _fromB, toB, inserted) => {
              const text = inserted.toString();
              if (text === '2' || text === '3') {
                const line = update.state.doc.lineAt(toB);
                const posInLine = toB - line.from;
                if (posInLine >= 2) {
                  const slice = line.text.slice(posInLine - 2, posInLine);
                  if (slice === '^2') {
                    setTimeout(() => {
                      viewRef.current?.dispatch({
                        changes: { from: toB - 2, to: toB, insert: '²' },
                      });
                    }, 0);
                  } else if (slice === '^3') {
                    setTimeout(() => {
                      viewRef.current?.dispatch({
                        changes: { from: toB - 2, to: toB, insert: '³' },
                      });
                    }, 0);
                  }
                }
              }
            });
          }
        }
      });

      const customKeymap = keymap.of([
        {
          key: 'Ctrl-Enter',
          run: () => {
            onEvaluate?.();
            return true;
          },
        },
        {
          key: 'F5',
          run: () => {
            onEvaluate?.();
            return true;
          },
        },
        ...defaultKeymap,
        ...historyKeymap,
      ]);

      const state = EditorState.create({
        doc: content,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          history(),
          phyxcalcLanguage,
          autocompleteExtension,
          customKeymap,
          updateListener,
          EditorView.theme({
            '&': {
              height: '100%',
              fontSize: '14px',
              fontFamily: 'monospace',
              backgroundColor: 'var(--color-editor-bg)',
              color: 'var(--color-editor-text)',
            },
            '.cm-scroller': { overflow: 'auto', lineHeight: '24px' },
            '.cm-content': { padding: '8px 0' },
            '.cm-line': { padding: '0 8px' },
            '.cm-activeLine': { backgroundColor: 'var(--color-active-line)' },
            '.cm-gutters': {
              backgroundColor: 'var(--color-gutter-bg)',
              color: 'var(--color-gutter-text)',
              borderRight: '1px solid var(--color-gutter-border)',
            },
            '.cm-activeLineGutter': {
              backgroundColor: 'var(--color-active-gutter)',
              color: 'var(--color-editor-text)',
            },
            '.cm-cursor': {
              borderLeftColor: 'var(--color-cursor)',
            },
          }),
        ],
      });

      const view = new EditorView({
        state,
        parent: editorContainerRef.current,
      });

      viewRef.current = view;

      // Synchronize scroll between editor and result panel
      const scrollHandler = () => {
        if (resultsContainerRef.current && view.scrollDOM) {
          resultsContainerRef.current.scrollTop = view.scrollDOM.scrollTop;
        }
      };

      view.scrollDOM.addEventListener('scroll', scrollHandler);

      return () => {
        view.scrollDOM.removeEventListener('scroll', scrollHandler);
        view.destroy();
      };
    }, []);

    // Update lint diagnostics from evaluation results
    useEffect(() => {
      if (!viewRef.current) return;
      const view = viewRef.current;
      const diagnostics: any[] = [];

      results.forEach((res, lineIdx) => {
        if (res.kind === 'error' && res.error) {
          const lineNum = lineIdx + 1;
          if (lineNum <= view.state.doc.lines) {
            const line = view.state.doc.line(lineNum);
            const lineStart = line.from;
            const from = lineStart + Math.min(res.error.start ?? 0, line.length);
            const to = lineStart + Math.min(res.error.end ?? line.length, line.length);

            diagnostics.push({
              from: Math.min(from, to),
              to: Math.max(from, to),
              severity: 'error',
              message: res.error.message,
            });
          }
        }
      });

      view.dispatch(setDiagnostics(view.state, diagnostics));
    }, [results]);

    const lines = content.split('\n');

    return (
      <>
        {/* Screen: CodeMirror Editor & Synchronized Results Gutter */}
        <div className="flex h-full w-full overflow-hidden border-t border-slate-200 dark:border-slate-800 print:hidden">
          {/* Left: CodeMirror Input Editor */}
          <div className="relative flex-1 h-full min-w-0" ref={editorContainerRef} />

          {/* Right: Results Gutter (Aligned with editor lines) */}
          <div
            ref={resultsContainerRef}
            className="w-80 min-w-[240px] h-full overflow-hidden border-l border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 select-text py-2"
          >
            {lines.map((_, idx) => {
              const res = results[idx];
              return (
                <div
                  key={idx}
                  className="h-6 px-3 flex items-center justify-end font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap text-right"
                  style={{ height: '24px' }}
                  title={res?.display || ''}
                >
                  {res && res.kind !== 'silent' && (
                    <span
                      className={`cursor-pointer px-1.5 py-0.5 rounded transition-colors ${
                        res.kind === 'error'
                          ? 'text-red-600 dark:text-red-400 bg-red-100/70 dark:bg-red-950/50 font-semibold'
                          : res.kind === 'display'
                          ? 'text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/30'
                          : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30'
                      }`}
                      onClick={() => {
                        if (res.display) {
                          navigator.clipboard.writeText(res.display);
                        }
                      }}
                    >
                      {res.display}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Print Only: High-Contrast Formatted Document */}
        <div className="hidden print:block w-full text-black font-mono text-xs p-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 text-left text-[11px] uppercase tracking-wider text-slate-700">
                <th className="py-1 px-2 w-10 text-slate-400">#</th>
                <th className="py-1 px-2">Expression</th>
                <th className="py-1 px-2 text-right w-64">Result</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((lineText, idx) => {
                const res = results[idx];
                const isComment = lineText.trim().startsWith('//');
                return (
                  <tr
                    key={idx}
                    className="border-b border-slate-200"
                    style={{ pageBreakInside: 'avoid' }}
                  >
                    <td className="py-1 px-2 text-slate-400 text-[10px]">{idx + 1}</td>
                    <td
                      className={`py-1 px-2 ${
                        isComment ? 'italic text-slate-500' : 'text-slate-900 font-medium'
                      }`}
                    >
                      {lineText || '\u00A0'}
                    </td>
                    <td className="py-1 px-2 text-right font-semibold text-blue-800">
                      {res && res.kind !== 'silent' ? res.display : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  }
);
