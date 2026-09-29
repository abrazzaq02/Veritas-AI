"use client";

import React, { useState } from "react";
import {
  FileText,
  Upload,
  Edit3,
  Trash2,
  Eye,
  Bookmark,
  Plus,
  CheckCircle2,
  Clock,
  Flag,
  Sparkles,
  BookOpen,
  X,
} from "lucide-react";
import type {
  CorpusSummary,
  CourseDocument,
  SavedNoteItem,
} from "@/types/rag";

interface CorpusAndStudyViewProps {
  corpus: CorpusSummary;
  documents: CourseDocument[];
  notes: SavedNoteItem[];
  onOpenNewDocModal: () => void;
  onEditDocument: (doc: CourseDocument) => void;
  onDeleteDocument: (docId: number) => void;
  onOpenDocumentReader: (docId: number) => void;
  onEditCorpus: () => void;
  onDeleteCorpus: () => void;
  onCreateNote: (payload: {
    corpusId: number;
    documentTitle: string;
    question: string;
    answer: string;
    citationRef: string;
    masteryStatus: string;
  }) => Promise<void>;
  onUpdateNote: (payload: {
    id: number;
    question?: string;
    answer?: string;
    masteryStatus?: string;
  }) => Promise<void>;
  onDeleteNote: (noteId: number) => Promise<void>;
}

export function CorpusAndStudyView({
  corpus,
  documents,
  notes,
  onOpenNewDocModal,
  onEditDocument,
  onDeleteDocument,
  onOpenDocumentReader,
  onEditCorpus,
  onDeleteCorpus,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}: CorpusAndStudyViewProps) {
  const [noteFilter, setNoteFilter] = useState<string>("all");
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newDocTitle, setNewDocTitle] = useState(
    documents[0]?.title || `${corpus.code} Lecture Archive`
  );
  const [newCitRef, setNewCitRef] = useState("§1.1 Core Concept Summary");

  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");

  const filteredNotes = notes.filter((n) =>
    noteFilter === "all" ? true : n.masteryStatus === noteFilter
  );

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    await onCreateNote({
      corpusId: corpus.id,
      documentTitle: newDocTitle,
      question: newQuestion,
      answer: newAnswer,
      citationRef: newCitRef,
      masteryStatus: "reviewing",
    });
    setNewQuestion("");
    setNewAnswer("");
    setShowNewNoteForm(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Corpus Overview Banner */}
      <div className="bg-white rounded-xl border border-[#E5E0D8] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded text-[12px] font-mono font-bold text-white"
              style={{ backgroundColor: corpus.accentColor || "#1E3A8A" }}
            >
              {corpus.code}
            </span>
            <span className="text-[12px] font-mono text-[#52525B]">
              {corpus.semester} • {corpus.professor}
            </span>
          </div>
          <h2 className="font-serif text-[24px] font-bold text-[#18181B]">
            {corpus.title}
          </h2>
          <p className="text-[14px] text-[#52525B] max-w-2xl">
            {corpus.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onEditCorpus}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F3EFEA] hover:bg-[#E5E0D8] text-[12px] font-medium text-[#18181B] cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#1E3A8A]" />
            <span>Configure Corpus</span>
          </button>
          <button
            type="button"
            onClick={onDeleteCorpus}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#DC2626]/30 text-[#DC2626] hover:bg-[#DC2626]/10 text-[12px] font-medium cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Corpus</span>
          </button>
        </div>
      </div>

      {/* Section 1: Indexed Documents CRUD Table */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-[20px] font-semibold text-[#18181B] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#1E3A8A]" />
              <span>Indexed Course Documents ({documents.length})</span>
            </h3>
            <p className="text-[13px] text-[#52525B]">
              Every uploaded document is segmented into overlapping passages and embedded into 64D semantic vectors.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenNewDocModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-[13px] font-medium hover:bg-[#1E3A8A]/90 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload / Index New Document</span>
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-[#D5CFC4] p-8 text-center space-y-3">
            <FileText className="w-8 h-8 text-[#52525B] mx-auto opacity-60" />
            <h4 className="font-serif text-[17px] font-semibold text-[#18181B]">
              No Documents Indexed Yet
            </h4>
            <p className="text-[13px] text-[#52525B] max-w-md mx-auto">
              Upload your first lecture note, syllabus, or research paper to populate the vector index for this course.
            </p>
            <button
              type="button"
              onClick={onOpenNewDocModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-[13px] font-medium cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Index First Document</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-[#E5E0D8] p-5 flex flex-col justify-between hover:border-[#1E3A8A]/40 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#1E3A8A]/10 text-[#1E3A8A]">
                      {doc.docType}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#059669]/10 text-[#059669] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                      {doc.chunkCount} Vector Chunks (64D)
                    </span>
                  </div>

                  <h4
                    onClick={() => onOpenDocumentReader(doc.id)}
                    className="font-serif text-[17px] font-semibold text-[#18181B] hover:text-[#1E3A8A] cursor-pointer line-clamp-1"
                  >
                    {doc.title}
                  </h4>

                  <div className="text-[12px] font-mono text-[#52525B] mt-1">
                    {doc.author} • {doc.sourceRef} • {doc.wordCount} words
                  </div>

                  <p className="text-[13px] text-[#52525B] line-clamp-2 mt-2.5 bg-[#FAF8F5] p-2.5 rounded border border-[#E5E0D8]">
                    {doc.content.replace(/^#+\s*/gm, "")}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E5E0D8] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenDocumentReader(doc.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F3EFEA] hover:bg-[#E5E0D8] text-[12px] font-medium text-[#18181B] cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>Inspect Vector Segments</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditDocument(doc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#D4D4D8] text-[12px] text-[#18181B] hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#1E3A8A]" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDocument(doc.id)}
                      className="p-1.5 rounded-md border border-[#DC2626]/30 text-[#DC2626] hover:bg-[#DC2626]/10 cursor-pointer"
                      title="Delete Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Saved Citation Study Cards & Flashcards CRUD */}
      <div className="space-y-4 pt-4 border-t border-[#E5E0D8]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-[20px] font-semibold text-[#18181B] flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#D97706]" />
              <span>Citation-Grounded Study Flashcards ({notes.length})</span>
            </h3>
            <p className="text-[13px] text-[#52525B]">
              Exam synthesis cards linked to retrieved document passages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-[#F3EFEA] p-0.5 border border-[#E5E0D8] text-[12px]">
              {[
                { id: "all", label: "All" },
                { id: "reviewing", label: "Reviewing" },
                { id: "mastered", label: "Mastered" },
                { id: "flagged", label: "Flagged" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setNoteFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                    noteFilter === tab.id
                      ? "bg-white text-[#18181B] shadow-2xs"
                      : "text-[#52525B] hover:text-[#18181B]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowNewNoteForm(!showNewNoteForm)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D97706] text-white text-[12px] font-medium hover:bg-[#D97706]/90 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Study Flashcard</span>
            </button>
          </div>
        </div>

        {showNewNoteForm && (
          <form
            onSubmit={handleAddNoteSubmit}
            className="bg-white rounded-xl border border-[#D97706]/50 p-5 space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-mono font-semibold text-[#D97706] uppercase">
                Create Citation-Linked Study Flashcard
              </span>
              <button
                type="button"
                onClick={() => setShowNewNoteForm(false)}
                className="text-[#52525B] hover:text-[#18181B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#52525B] mb-1">
                  Source Document Reference
                </label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded bg-[#FAF8F5] border border-[#D4D4D8] text-[12px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#52525B] mb-1">
                  Section / Page Citation
                </label>
                <input
                  type="text"
                  value={newCitRef}
                  onChange={(e) => setNewCitRef(e.target.value)}
                  className="w-full h-9 px-3 rounded bg-[#FAF8F5] border border-[#D4D4D8] text-[12px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#52525B] mb-1">
                Exam Prompt / Study Question
              </label>
              <input
                type="text"
                required
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="e.g., How does rotational catalysis in F1 beta-subunits synthesize ATP?"
                className="w-full h-9 px-3 rounded bg-[#FAF8F5] border border-[#D4D4D8] text-[13px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#52525B] mb-1">
                Grounded Answer & Evidence
              </label>
              <textarea
                rows={3}
                required
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="Write the synthesized answer grounded in course readings..."
                className="w-full p-3 rounded bg-[#FAF8F5] border border-[#D4D4D8] text-[13px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewNoteForm(false)}
                className="px-3 py-1.5 rounded border border-[#D4D4D8] text-[12px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#D97706] text-white text-[12px] font-medium cursor-pointer"
              >
                Save Study Card
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => {
            const isEditing = editingNoteId === note.id;

            return (
              <div
                key={note.id}
                className="bg-white rounded-xl border border-[#E5E0D8] p-5 flex flex-col justify-between space-y-3 shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-[#D97706] font-semibold truncate">
                      {note.citationRef}
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateNote({
                            id: note.id,
                            masteryStatus:
                              note.masteryStatus === "mastered"
                                ? "reviewing"
                                : note.masteryStatus === "reviewing"
                                ? "flagged"
                                : "mastered",
                          })
                        }
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium cursor-pointer border ${
                          note.masteryStatus === "mastered"
                            ? "bg-[#059669]/10 text-[#059669] border-[#059669]/30"
                            : note.masteryStatus === "flagged"
                            ? "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30"
                            : "bg-[#FEF3C7] text-[#92400E] border-[#D97706]/30"
                        }`}
                      >
                        {note.masteryStatus === "mastered" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : note.masteryStatus === "flagged" ? (
                          <Flag className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span className="capitalize">{note.masteryStatus}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoteId(note.id);
                          setEditQ(note.question);
                          setEditA(note.answer);
                        }}
                        className="p-1 text-[#52525B] hover:text-[#1E3A8A] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteNote(note.id)}
                        className="p-1 text-[#52525B] hover:text-[#DC2626] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        value={editQ}
                        onChange={(e) => setEditQ(e.target.value)}
                        className="w-full h-8 px-2.5 rounded bg-[#FAF8F5] border border-[#D4D4D8] text-[13px] font-semibold"
                      />
                      <textarea
                        rows={3}
                        value={editA}
                        onChange={(e) => setEditA(e.target.value)}
                        className="w-full p-2.5 rounded bg-[#FAF8F5] border border-[#D4D4D8] text-[13px]"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingNoteId(null)}
                          className="px-2.5 py-1 rounded border text-[11px]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await onUpdateNote({
                              id: note.id,
                              question: editQ,
                              answer: editA,
                            });
                            setEditingNoteId(null);
                          }}
                          className="px-3 py-1 rounded bg-[#1E3A8A] text-white text-[11px] cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-serif text-[16px] font-semibold text-[#18181B]">
                        {note.question}
                      </h4>
                      <p className="text-[13.5px] leading-[1.6] text-[#27272A] bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]">
                        {note.answer}
                      </p>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#52525B] pt-2 border-t border-[#E5E0D8]">
                  <span className="truncate flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#1E3A8A]" />
                    {note.documentTitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
