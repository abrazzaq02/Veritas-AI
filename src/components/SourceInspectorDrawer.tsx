"use client";

import React from "react";
import {
  Sparkles,
  FileText,
  BookmarkPlus,
  ExternalLink,
  Cpu,
  Layers,
  CheckCircle2,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { CitationItem, RagTelemetry } from "@/types/rag";

interface SourceInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  citations: CitationItem[];
  telemetry: RagTelemetry | null;
  activeCitationNumber: number | null;
  onSelectCitationNumber: (num: number) => void;
  onOpenDocumentReader: (documentId: number, highlightChunkId?: number) => void;
  onSaveCitationAsNote: (citation: CitationItem) => void;
  savedChunkIds: Set<number>;
}

export function SourceInspectorDrawer({
  isOpen,
  onClose,
  citations,
  telemetry,
  activeCitationNumber,
  onSelectCitationNumber,
  onOpenDocumentReader,
  onSaveCitationAsNote,
  savedChunkIds,
}: SourceInspectorDrawerProps) {
  if (!isOpen) return null;

  const highlightMatchedTerms = (text: string, terms: string[]) => {
    if (!terms || terms.length === 0) return text;
    const escaped = terms
      .filter((t) => t.length >= 3)
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (escaped.length === 0) return text;

    const regex = new RegExp(`(${escaped.join("|")})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (regex.test(part)) {
        return (
          <mark
            key={i}
            className="bg-[#FEF3C7] text-[#18181B] px-1 py-0.5 rounded font-medium border-b border-[#D97706]/50"
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  return (
    <aside className="w-full lg:w-[390px] xl:w-[410px] shrink-0 bg-[#F3EFEA] border-l border-[#E5E0D8] flex flex-col h-full overflow-hidden">
      {/* Drawer Header */}
      <div className="px-4 py-3.5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#1E3A8A]/10 border border-[#1E3A8A]/20 flex items-center justify-center text-[#1E3A8A]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-[15px] font-semibold text-[#18181B] leading-tight">
              Source & Vector Inspector
            </h3>
            <p className="text-[11px] font-mono text-[#52525B]">
              {citations.length} Top-K Grounded Passages Retrieved
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-md text-[#52525B] hover:text-[#18181B] hover:bg-[#E5E0D8]/60"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Telemetry Strip */}
      {telemetry && (
        <div className="px-4 py-3 bg-[#FAF8F5]/80 border-b border-[#E5E0D8] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="inline-flex items-center gap-1.5 text-[#1E3A8A] font-medium">
              <Cpu className="w-3.5 h-3.5" />
              <span>PIPELINE TELEMETRY</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#059669]/10 text-[#059669] border border-[#059669]/25 font-semibold">
              {telemetry.retrievalMode === "hybrid"
                ? "Hybrid Dense+BM25"
                : telemetry.retrievalMode === "mmr_diverse"
                ? "MMR Diversity"
                : "Dense Cosine 64D"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-white px-2 py-1.5 rounded border border-[#E5E0D8]">
              <div className="text-[10px] text-[#52525B] font-mono uppercase">
                Embed
              </div>
              <div className="text-[12px] font-mono font-semibold text-[#18181B]">
                {telemetry.embedLatencyMs}ms
              </div>
            </div>
            <div className="bg-white px-2 py-1.5 rounded border border-[#E5E0D8]">
              <div className="text-[10px] text-[#52525B] font-mono uppercase">
                Vector ANN
              </div>
              <div className="text-[12px] font-mono font-semibold text-[#059669]">
                {telemetry.retrievalLatencyMs}ms
              </div>
            </div>
            <div className="bg-white px-2 py-1.5 rounded border border-[#E5E0D8]">
              <div className="text-[10px] text-[#52525B] font-mono uppercase">
                Synthesize
              </div>
              <div className="text-[12px] font-mono font-semibold text-[#1E3A8A]">
                {telemetry.synthesisLatencyMs}ms
              </div>
            </div>
          </div>

          {/* Query Vector Barcode Preview */}
          {telemetry.queryVectorPreview &&
            telemetry.queryVectorPreview.length > 0 && (
              <div className="pt-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#52525B] mb-1">
                  <span>QUERY EMBEDDING VECTOR (64D L2-NORM)</span>
                  <span>
                    Scanned {telemetry.totalChunksScanned} chunks
                  </span>
                </div>
                <div className="flex items-center gap-0.5 h-3 bg-white p-0.5 rounded border border-[#E5E0D8]">
                  {telemetry.queryVectorPreview.map((val, idx) => {
                    const intensity = Math.min(1, Math.max(0.15, Math.abs(val) * 2.8));
                    const isPositive = val >= 0;
                    return (
                      <div
                        key={idx}
                        className="flex-1 h-full rounded-[1px]"
                        style={{
                          backgroundColor: isPositive
                            ? `rgba(30, 58, 138, ${intensity})`
                            : `rgba(217, 119, 6, ${intensity})`,
                        }}
                        title={`dim[${idx}] = ${val.toFixed(4)}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Retrieved Chunks Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {citations.length === 0 ? (
          <div className="bg-[#FAF8F5] border border-dashed border-[#D5CFC4] rounded-xl p-6 text-center space-y-2 my-6">
            <SlidersHorizontal className="w-7 h-7 text-[#52525B] mx-auto opacity-70" />
            <h4 className="font-serif text-[15px] font-semibold text-[#18181B]">
              No Retrieved Passages Selected
            </h4>
            <p className="text-[13px] text-[#52525B] leading-relaxed">
              Ask a question in the Q&A Studio or click any citation badge{" "}
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E]">
                [1]
              </span>{" "}
              in an assistant response to inspect the exact vector chunks and cosine similarity scores.
            </p>
          </div>
        ) : (
          citations.map((cit) => {
            const isSelected = activeCitationNumber === cit.citationNumber;
            const isSaved = savedChunkIds.has(cit.chunkId);
            const matchPct = Math.round(cit.similarityScore * 100);

            return (
              <div
                key={`${cit.chunkId}-${cit.citationNumber}`}
                id={`inspector-chunk-${cit.citationNumber}`}
                onClick={() => onSelectCitationNumber(cit.citationNumber)}
                className={`group rounded-xl p-4 transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-[#FFFBEB] border-[#D97706] ring-2 ring-[#D97706]/25 shadow-md citation-flash"
                    : "bg-[#FAF8F5] border-[#E5E0D8] hover:border-[#1E3A8A]/40 shadow-xs"
                }`}
              >
                {/* Top Row: Citation Pill + Similarity Score */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`inline-flex items-center justify-center px-2 py-0.5 text-[12px] font-mono font-bold rounded ${
                        isSelected
                          ? "bg-[#D97706] text-white"
                          : "bg-[#FEF3C7] text-[#92400E] border border-[#D97706]/40"
                      }`}
                    >
                      [{cit.citationNumber}]
                    </span>
                    <span className="text-[11px] font-mono text-[#52525B] truncate">
                      Chunk #{cit.chunkId} • p.{cit.pageNumber}
                    </span>
                  </div>

                  {/* Cosine Similarity Badge */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
                        cit.similarityScore >= 0.72
                          ? "bg-[#059669]/10 text-[#059669] border-[#059669]/30"
                          : "bg-[#D97706]/10 text-[#B45309] border-[#D97706]/30"
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      {cit.similarityScore.toFixed(2)} Match ({matchPct}%)
                    </span>
                  </div>
                </div>

                {/* Document & Section Header */}
                <div className="mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#1E3A8A]">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{cit.documentTitle}</span>
                  </div>
                  <h4 className="font-serif text-[14px] font-semibold text-[#18181B] mt-0.5">
                    {cit.sectionTitle}
                  </h4>
                </div>

                {/* Highlighted Excerpt */}
                <div className="text-[13px] leading-[1.6] text-[#27272A] bg-white p-3 rounded-lg border border-[#E5E0D8] font-sans">
                  {highlightMatchedTerms(cit.excerpt, cit.matchedTerms || [])}
                </div>

                {/* Vector Score Decomposition & Mini Embedding Bar */}
                <div className="mt-2.5 pt-2.5 border-t border-[#E5E0D8]/80 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#52525B]">
                    <span>
                      Cosine:{" "}
                      <strong className="text-[#18181B]">
                        {cit.cosineScore.toFixed(3)}
                      </strong>
                    </span>
                    <span>
                      BM25 Lexical:{" "}
                      <strong className="text-[#18181B]">
                        {cit.keywordScore.toFixed(3)}
                      </strong>
                    </span>
                  </div>

                  {/* Matched Semantic Keywords */}
                  {cit.matchedTerms && cit.matchedTerms.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {cit.matchedTerms.map((term, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-1.5 py-0.5 text-[10px] font-mono bg-[#F3EFEA] text-[#52525B] rounded border border-[#E5E0D8]"
                        >
                          #{term}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSaveCitationAsNote(cit);
                      }}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                        isSaved
                          ? "bg-[#059669]/15 text-[#059669] border border-[#059669]/30"
                          : "bg-white text-[#18181B] border border-[#D5CFC4] hover:bg-[#F3EFEA]"
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Saved to Study Cards</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-3.5 h-3.5 text-[#D97706]" />
                          <span>Save as Study Card</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDocumentReader(cit.documentId, cit.chunkId);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-[#1E3A8A]/10 text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white transition-colors cursor-pointer"
                    >
                      <span>Full Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
