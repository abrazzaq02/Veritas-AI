"use client";

import React from "react";
import type { CitationItem } from "@/types/rag";

interface CitationAnswerRendererProps {
  content: string;
  citations: CitationItem[];
  activeCitationNumber: number | null;
  onCitationClick: (citation: CitationItem) => void;
}

export function CitationAnswerRenderer({
  content,
  citations,
  activeCitationNumber,
  onCitationClick,
}: CitationAnswerRendererProps) {
  const citationMap = new Map<number, CitationItem>();
  for (const c of citations || []) {
    citationMap.set(c.citationNumber, c);
  }

  const renderInlineTokens = (line: string, lineKey: string) => {
    // Split by citation markers like [1], [2], bold **...**, italic *...*, and inline code `...`
    const pattern = /(\[\d+\]|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    const parts = line.split(pattern);

    return parts.map((part, idx) => {
      if (!part) return null;

      // Citation marker [1], [2], etc.
      const citeMatch = part.match(/^\[(\d+)\]$/);
      if (citeMatch) {
        const num = Number(citeMatch[1]);
        const cItem = citationMap.get(num);
        const isActive = activeCitationNumber === num;

        if (!cItem) {
          return (
            <span
              key={`${lineKey}-c-${idx}`}
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-[11px] font-mono font-semibold rounded bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/40"
            >
              [{num}]
            </span>
          );
        }

        return (
          <button
            key={`${lineKey}-c-${idx}`}
            type="button"
            onClick={() => onCitationClick(cItem)}
            title={`${cItem.documentTitle} — ${cItem.sectionTitle} (${Math.round(
              cItem.similarityScore * 100
            )}% vector match)`}
            className={`group relative inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 text-[11px] font-mono font-semibold rounded transition-all cursor-pointer align-baseline ${
              isActive
                ? "bg-[#D97706] text-white ring-2 ring-[#D97706]/40 shadow-sm"
                : "bg-[#FEF3C7] text-[#92400E] border border-[#D97706]/40 hover:bg-[#D97706] hover:text-white"
            }`}
          >
            <span>[{num}]</span>
            <span className="hidden sm:inline text-[10px] opacity-80">
              {(cItem.similarityScore * 100).toFixed(0)}%
            </span>
          </button>
        );
      }

      // Bold **...**
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong
            key={`${lineKey}-b-${idx}`}
            className="font-semibold text-[#18181B]"
          >
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Italic *...*
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em
            key={`${lineKey}-i-${idx}`}
            className="italic text-[#3F3F46]"
          >
            {part.slice(1, -1)}
          </em>
        );
      }

      // Inline code `...`
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={`${lineKey}-code-${idx}`}
            className="px-1.5 py-0.5 mx-0.5 text-[12px] font-mono bg-[#F3EFEA] text-[#1E3A8A] border border-[#E5E0D8] rounded"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      return <React.Fragment key={`${lineKey}-t-${idx}`}>{part}</React.Fragment>;
    });
  };

  const blocks = content.split(/\n{2,}/);

  return (
    <div className="space-y-3.5 text-[15px] leading-[1.68] text-[#27272A]">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("### ")) {
          const headingText = trimmed.replace(/^###\s+/, "");
          return (
            <h4
              key={`b-${bIdx}`}
              className="font-serif text-[17px] font-semibold text-[#18181B] pt-2 pb-0.5 border-b border-[#E5E0D8]/80 flex items-center gap-2"
            >
              <span className="w-1.5 h-4 rounded-full bg-[#1E3A8A] inline-block" />
              {headingText}
            </h4>
          );
        }

        // Check if block is a bullet list
        const lines = trimmed.split("\n");
        const isBulletList = lines.every((l) => l.trim().startsWith("- "));

        if (isBulletList) {
          return (
            <ul key={`b-${bIdx}`} className="space-y-2.5 pl-1">
              {lines.map((line, lIdx) => {
                const itemText = line.trim().replace(/^-\s+/, "");
                return (
                  <li
                    key={`b-${bIdx}-l-${lIdx}`}
                    className="flex items-start gap-2.5 bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#D97706] shrink-0" />
                    <div className="flex-1 text-[14px] leading-[1.62]">
                      {renderInlineTokens(itemText, `b-${bIdx}-l-${lIdx}`)}
                    </div>
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={`b-${bIdx}`} className="max-w-[68ch]">
            {renderInlineTokens(trimmed, `b-${bIdx}`)}
          </p>
        );
      })}
    </div>
  );
}
