"use client";

import React, { useState } from "react";
import {
  X,
  Upload,
  FileText,
  Sparkles,
  BookOpen,
  UserCheck,
  PlusCircle,
  Cpu,
  Trash2,
  Edit3,
  Check,
} from "lucide-react";
import type {
  CourseDocument,
  VectorChunk,
  CorpusSummary,
  StudentUser,
} from "@/types/rag";

const ACADEMIC_DOCUMENT_PRESETS = [
  {
    label: "Neuropharmacology: Dopamine Pathways & D1/D2 Signaling",
    title: "Lecture 09: Dopaminergic Mesolimbic Pathways & GPCR Signaling.md",
    docType: "Lecture Notes",
    author: "Prof. Elena Rostova",
    sourceRef: "Pages 118–132 • Week 9 Module",
    content: `# §9.1 Mesolimbic vs. Nigrostriatal Dopamine Projections
Dopaminergic neurons originating in the Ventral Tegmental Area (VTA) project via the mesolimbic pathway to the nucleus accumbens and prefrontal cortex, encoding reward prediction error and incentive salience. Conversely, dopaminergic neurons in the Substantia Nigra pars compacta (SNc) project to the dorsal striatum via the nigrostriatal pathway to gate voluntary motor initiation; degeneration of SNc neurons underlies bradykinesia in Parkinson's disease.

# §9.2 D1-Like (Gs-Coupled) vs. D2-Like (Gi-Coupled) GPCR Cascades
Postsynaptic dopamine signaling bifurcates across two G-protein-coupled receptor families. D1 and D5 receptors couple to G_alpha_s/olf, stimulating adenylyl cyclase to elevate intracellular cAMP and activate Protein Kinase A (PKA), which phosphorylates DARPP-32 at Thr34 to inhibit Protein Phosphatase-1 (PP1). In contrast, D2, D3, and D4 receptors couple to inhibitory G_alpha_i/o, suppressing adenylyl cyclase, reducing cAMP, activating inward-rectifying K+ channels (GIRK), and inhibiting voltage-gated Ca2+ currents.`,
  },
  {
    label: "Distributed Systems: Raft Consensus & Leader Election",
    title: "Module 08: Raft Consensus, Log Replication & Split-Vote Safety.pdf",
    docType: "Research Paper",
    author: "Prof. Marcus Chen",
    sourceRef: "Pages 45–62 • Consensus Protocols",
    content: `# §8.1 Raft State Machine & Term Monotonicity
Raft decomposes distributed state machine consensus into three subproblems: Leader Election, Log Replication, and Safety. Every cluster node operates in one of three states: Leader, Follower, or Candidate. Logical time is partitioned into monotonically increasing Terms indexed by consecutive integers. Each term begins with an election lottery using randomized election timeouts (150–300 ms) to prevent synchronous split votes.

# §8.2 Quorum Log Replication & Election Safety Restriction
A Raft leader accepts client writes, appends the command as a new log entry, and issues AppendEntries RPCs in parallel to followers. An entry is considered committed once replicated on a strict majority quorum (N/2 + 1 nodes). Raft guarantees the Leader Completeness Property by restricting RequestVote approvals: a voter denies its vote if the candidate's log is less up-to-date than its own (compared first by lastLogTerm, then by lastLogIndex).`,
  },
  {
    label: "European History: The Congress of Vienna (1815) & Metternich",
    title: "Seminar 06: The 1815 Congress of Vienna & Concert of Europe.md",
    docType: "Textbook Chapter",
    author: "Prof. Julian Sterling",
    sourceRef: "Pages 140–156 • Post-Napoleonic Order",
    content: `# §6.1 Metternich's Equilibrium & Legitimacy Doctrine
Following the defeat of Napoleon Bonaparte, Klemens von Metternich and Lord Castlereagh convened the Congress of Vienna (1814–1815) to construct a durable multipolar balance of power. Rather than imposing punitive dismemberment on Bourbon France, the Quadruple Alliance (Austria, Britain, Prussia, Russia) integrated France into the diplomatic Pentarchy while fortifying buffer states along French frontiers, including the Kingdom of the United Netherlands and the German Confederation.

# §6.2 The Concert of Europe & Interventionist Congress System
Through the Congress System (Aix-la-Chapelle, Troppau, Laibach, Verona), conservative continental powers pledged collective intervention against liberal constitutional uprisings in Naples and Spain. However, British Foreign Secretary George Canning broke with continental interventionism by 1822, prioritizing maritime commercial hegemony over absolutist ideological policing.`,
  },
];

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  corpus: CorpusSummary;
  initialDoc?: CourseDocument | null;
  onSave: (payload: {
    id?: number;
    corpusId: number;
    title: string;
    docType: string;
    author: string;
    sourceRef: string;
    content: string;
    customChunkSize: number;
    customChunkOverlap: number;
  }) => Promise<void>;
}

export function DocumentModal({
  isOpen,
  onClose,
  corpus,
  initialDoc,
  onSave,
}: DocumentModalProps) {
  const [title, setTitle] = useState(initialDoc?.title || "");
  const [docType, setDocType] = useState(
    initialDoc?.docType || "Lecture Notes"
  );
  const [author, setAuthor] = useState(
    initialDoc?.author || corpus.professor || "Course Faculty"
  );
  const [sourceRef, setSourceRef] = useState(
    initialDoc?.sourceRef || "Pages 1–15 • Uploaded Module"
  );
  const [content, setContent] = useState(initialDoc?.content || "");
  const [chunkSize, setChunkSize] = useState(corpus.chunkSize || 480);
  const [chunkOverlap, setChunkOverlap] = useState(corpus.chunkOverlap || 75);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!title) {
      setTitle(file.name);
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") {
        setContent(text);
      }
    };
    reader.readAsText(file);
  };

  const applyPreset = (preset: (typeof ACADEMIC_DOCUMENT_PRESETS)[number]) => {
    setTitle(preset.title);
    setDocType(preset.docType);
    setAuthor(preset.author);
    setSourceRef(preset.sourceRef);
    setContent(preset.content);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      await onSave({
        id: initialDoc?.id,
        corpusId: corpus.id,
        title,
        docType,
        author,
        sourceRef,
        content,
        customChunkSize: chunkSize,
        customChunkOverlap: chunkOverlap,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const estimatedChunks = Math.max(
    1,
    Math.ceil(
      Math.max(1, content.trim().length) /
        Math.max(120, chunkSize - chunkOverlap)
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
        <div className="px-6 py-4 bg-[#F3EFEA] border-b border-[#E5E0D8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-[18px] font-semibold text-[#18181B]">
                {initialDoc
                  ? "Edit & Re-Embed Course Document"
                  : `Index New Document into ${corpus.code}`}
              </h3>
              <p className="text-[12px] text-[#52525B] font-mono">
                Automatic Section Chunking + 64D L2-Normalized Semantic Vectorization
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#52525B] hover:text-[#18181B] hover:bg-[#E5E0D8]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!initialDoc && (
            <div className="bg-[#F3EFEA] p-3 rounded-lg border border-[#E5E0D8] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-[#1E3A8A] uppercase">
                  1-Click Academic Preset Templates (Or Upload .MD / .TXT)
                </span>
                <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-[#D5CFC4] text-[11px] font-medium text-[#18181B] hover:bg-[#FAF8F5] cursor-pointer">
                  <Upload className="w-3 h-3 text-[#1E3A8A]" />
                  <span>Upload Local File</span>
                  <input
                    type="file"
                    accept=".txt,.md,.csv,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ACADEMIC_DOCUMENT_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-2.5 py-1 rounded text-[11px] bg-white hover:bg-[#FEF3C7] text-[#18181B] border border-[#E5E0D8] transition-colors cursor-pointer text-left"
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                Document Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Lecture 09: Dopaminergic Signaling.md"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              >
                <option value="Lecture Notes">Lecture Notes</option>
                <option value="Research Paper">Research Paper</option>
                <option value="Textbook Chapter">Textbook Chapter</option>
                <option value="Syllabus & Exam Guide">
                  Syllabus & Exam Guide
                </option>
                <option value="Lab Protocol">Lab Protocol</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                Author / Instructor
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                Source / Page Reference
              </label>
              <input
                type="text"
                value={sourceRef}
                onChange={(e) => setSourceRef(e.target.value)}
                placeholder="e.g., Pages 118–132 • Week 9"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[12px] font-medium text-[#18181B]">
                Document Text Content (Use `# §1.1 Section Title` headers for section-aware chunking)
              </label>
              <span className="text-[11px] font-mono text-[#059669]">
                ~{estimatedChunks} vector chunks will be generated
              </span>
            </div>
            <textarea
              required
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste lecture notes, research paper paragraphs, textbook excerpts, or syllabus content here..."
              className="w-full p-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px] font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>

          {/* Chunking Hyperparameters */}
          <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-[#F3EFEA] border border-[#E5E0D8]">
            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="text-[#52525B]">CHUNK WINDOW SIZE</span>
                <span className="font-semibold text-[#18181B]">
                  {chunkSize} chars
                </span>
              </div>
              <input
                type="range"
                min={260}
                max={900}
                step={20}
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                className="w-full accent-[#1E3A8A]"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="text-[#52525B]">SLIDING OVERLAP</span>
                <span className="font-semibold text-[#18181B]">
                  {chunkOverlap} chars
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={180}
                step={15}
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(Number(e.target.value))}
                className="w-full accent-[#1E3A8A]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E5E0D8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#D4D4D8] text-[13px] font-medium text-[#52525B] hover:text-[#18181B]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#1E3A8A] text-white text-[13px] font-medium hover:bg-[#1E3A8A]/90 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {submitting
                  ? "Chunking & Embedding 64D Vectors..."
                  : initialDoc
                  ? "Save & Re-Index Vectors"
                  : "Chunk & Embed into Vector DB"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CorpusModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCorpus?: CorpusSummary | null;
  onSave: (payload: {
    id?: number;
    code: string;
    title: string;
    professor: string;
    semester: string;
    description: string;
    chunkSize: number;
    chunkOverlap: number;
    accentColor: string;
    starterContent?: string;
  }) => Promise<void>;
}

export function CorpusModal({
  isOpen,
  onClose,
  initialCorpus,
  onSave,
}: CorpusModalProps) {
  const [code, setCode] = useState(initialCorpus?.code || "");
  const [title, setTitle] = useState(initialCorpus?.title || "");
  const [professor, setProfessor] = useState(
    initialCorpus?.professor || "Prof. A. Turing, Ph.D."
  );
  const [semester, setSemester] = useState(
    initialCorpus?.semester || "Spring 2026"
  );
  const [description, setDescription] = useState(
    initialCorpus?.description || ""
  );
  const [chunkSize, setChunkSize] = useState(initialCorpus?.chunkSize || 480);
  const [chunkOverlap, setChunkOverlap] = useState(
    initialCorpus?.chunkOverlap || 75
  );
  const [accentColor, setAccentColor] = useState(
    initialCorpus?.accentColor || "#1E3A8A"
  );
  const [starterContent, setStarterContent] = useState(
    initialCorpus
      ? ""
      : `# §1.1 Course Objectives & Core Theoretical Framework\nThis course explores foundational mathematical models, experimental methodologies, and primary scholarly texts. Students can query this corpus using semantic vector retrieval and grounded AI Q&A.`
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) return;
    setSubmitting(true);
    try {
      await onSave({
        id: initialCorpus?.id,
        code,
        title,
        professor,
        semester,
        description,
        chunkSize,
        chunkOverlap,
        accentColor,
        starterContent: initialCorpus ? undefined : starterContent,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden my-8">
        <div className="px-6 py-4 bg-[#F3EFEA] border-b border-[#E5E0D8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-[18px] font-semibold text-[#18181B]">
                {initialCorpus
                  ? `Configure Corpus ${initialCorpus.code}`
                  : "Create New Course Corpus"}
              </h3>
              <p className="text-[12px] text-[#52525B] font-mono">
                Isolated Vector Namespace & Retrieval Policy
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#52525B] hover:text-[#18181B] hover:bg-[#E5E0D8]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                Course Code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="PHYS-310"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px] font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                Course Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Quantum Mechanics & Statistical Thermodynamics"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                Professor / Instructor
              </label>
              <input
                type="text"
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                Academic Term
              </label>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#18181B] mb-1">
              Corpus Scope & Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the lecture modules, papers, and exam topics indexed in this corpus..."
              className="w-full p-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>

          {!initialCorpus && (
            <div>
              <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                Initial Syllabus / Seed Document (Auto-indexed on creation)
              </label>
              <textarea
                rows={3}
                value={starterContent}
                onChange={(e) => setStarterContent(e.target.value)}
                className="w-full p-3 rounded-lg bg-white border border-[#D4D4D8] text-[12px] font-mono focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[#E5E0D8]">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#52525B]">Badge Color:</span>
              {["#1E3A8A", "#059669", "#D97706", "#7C3AED"].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setAccentColor(col)}
                  className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                    accentColor === col
                      ? "border-[#18181B] scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-[#D4D4D8] text-[13px] font-medium text-[#52525B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-[13px] font-medium hover:bg-[#1E3A8A]/90 cursor-pointer"
              >
                {submitting
                  ? "Saving..."
                  : initialCorpus
                  ? "Update Corpus"
                  : "Create Corpus"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DocumentReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: CourseDocument | null;
  chunks: VectorChunk[];
  highlightChunkId: number | null;
  onEditDocument: (doc: CourseDocument) => void;
  onDeleteDocument: (docId: number) => void;
}

export function DocumentReaderModal({
  isOpen,
  onClose,
  document,
  chunks,
  highlightChunkId,
  onEditDocument,
  onDeleteDocument,
}: DocumentReaderModalProps) {
  if (!isOpen || !document) return null;

  const docChunks = chunks.filter((c) => c.documentId === document.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F3EFEA] border-b border-[#E5E0D8] flex items-center justify-between">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#1E3A8A]">
              <span className="px-2 py-0.5 rounded bg-[#1E3A8A]/10 font-semibold">
                {document.docType}
              </span>
              <span>•</span>
              <span>{document.author}</span>
              <span>•</span>
              <span>{document.sourceRef}</span>
            </div>
            <h3 className="font-serif text-[20px] font-semibold text-[#18181B] truncate mt-1">
              {document.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditDocument(document);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#D4D4D8] text-[12px] font-medium text-[#18181B] hover:bg-[#FAF8F5] cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>Edit & Re-Chunk</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteDocument(document.id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#DC2626]/30 text-[12px] font-medium text-[#DC2626] hover:bg-[#DC2626]/10 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#52525B] hover:text-[#18181B] hover:bg-[#E5E0D8]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body: Indexed Vector Chunks Breakdown */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between bg-[#F3EFEA] px-4 py-2.5 rounded-lg border border-[#E5E0D8] text-[12px] font-mono text-[#52525B]">
            <span className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#059669]" />
              <span>
                Vector Index Status:{" "}
                <strong className="text-[#059669] uppercase">
                  {document.status}
                </strong>
              </span>
            </span>
            <span>
              {docChunks.length} Vector Segments • {document.wordCount} Words •
              64D L2-Normalized Float Space
            </span>
          </div>

          <div className="space-y-3">
            {docChunks.map((ch) => {
              const isHighlighted = highlightChunkId === ch.id;
              return (
                <div
                  key={ch.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isHighlighted
                      ? "bg-[#FFFBEB] border-[#D97706] ring-2 ring-[#D97706]/30 citation-flash"
                      : "bg-white border-[#E5E0D8]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#1E3A8A]/10 text-[#1E3A8A]">
                        Segment #{ch.chunkIndex + 1} (ID: {ch.id})
                      </span>
                      <h4 className="font-serif text-[15px] font-semibold text-[#18181B]">
                        {ch.sectionTitle}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-[#52525B]">
                      Page {ch.pageNumber} • {ch.tokenCount} tokens • ||v|| ={" "}
                      {ch.vectorNorm.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-[14px] leading-[1.65] text-[#27272A]">
                    {ch.content}
                  </p>

                  {/* Keywords + Mini Vector Preview */}
                  <div className="mt-3 pt-2.5 border-t border-[#E5E0D8] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {(ch.keywords || []).map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#F3EFEA] text-[#52525B]"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-[#52525B] mr-1">
                        64D emb[0..11]:
                      </span>
                      {(ch.embedding || []).slice(0, 12).map((val, idx) => (
                        <span
                          key={idx}
                          className="w-2 h-3 rounded-[1px] inline-block"
                          style={{
                            backgroundColor:
                              val >= 0
                                ? `rgba(30, 58, 138, ${Math.min(1, Math.max(0.2, Math.abs(val) * 3))})`
                                : `rgba(217, 119, 6, ${Math.min(1, Math.max(0.2, Math.abs(val) * 3))})`,
                          }}
                          title={`dim[${idx}] = ${val}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: StudentUser | null;
  onAuthSuccess: (user: StudentUser) => void;
}

export function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
}: AuthModalProps) {
  const [tab, setTab] = useState<"profile" | "login" | "register" | "reset">(
    currentUser ? "profile" : "login"
  );
  const [email, setEmail] = useState(
    currentUser?.email || "clara.vance@columbia.edu"
  );
  const [password, setPassword] = useState("scholar2026");
  const [newPassword, setNewPassword] = useState("");
  const [name, setName] = useState(currentUser?.name || "");
  const [major, setMajor] = useState(
    currentUser?.major || "Computational Neurobiology & CS"
  );
  const [university, setUniversity] = useState(
    currentUser?.university || "Columbia Archival Research Institute"
  );
  const [role, setRole] = useState<"student" | "faculty" | "admin">(
    currentUser?.role || "student"
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginOrRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const action = tab === "register" ? "register" : tab === "reset" ? "reset" : "login";
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          email,
          password,
          name,
          major,
          university,
          role,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed");
        return;
      }
      if (data.user) {
        onAuthSuccess(data.user);
        if (tab !== "reset") onClose();
      }
    } catch {
      setError("Network error while authenticating");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentUser.id,
          name: name || currentUser.name,
          major,
          university,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onAuthSuccess(data.user);
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 bg-[#F3EFEA] border-b border-[#E5E0D8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-[17px] font-semibold text-[#18181B]">
                Scholar Identity & Session
              </h3>
              <p className="text-[11px] font-mono text-[#52525B]">
                Archival RAG Credentials
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#52525B] hover:text-[#18181B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-[#E5E0D8] bg-[#F3EFEA]/60 text-[12px] font-medium">
          {currentUser && (
            <button
              type="button"
              onClick={() => setTab("profile")}
              className={`flex-1 py-2.5 border-b-2 cursor-pointer ${
                tab === "profile"
                  ? "border-[#1E3A8A] text-[#1E3A8A] bg-[#FAF8F5]"
                  : "border-transparent text-[#52525B]"
              }`}
            >
              Profile
            </button>
          )}
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`flex-1 py-2.5 border-b-2 cursor-pointer ${
              tab === "login"
                ? "border-[#1E3A8A] text-[#1E3A8A] bg-[#FAF8F5]"
                : "border-transparent text-[#52525B]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`flex-1 py-2.5 border-b-2 cursor-pointer ${
              tab === "register"
                ? "border-[#1E3A8A] text-[#1E3A8A] bg-[#FAF8F5]"
                : "border-transparent text-[#52525B]"
            }`}
          >
            Register
          </button>
        </div>

        {tab === "profile" && currentUser ? (
          <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
            <div className="p-3 rounded-lg bg-[#F3EFEA] border border-[#E5E0D8] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1E3A8A] text-white font-serif font-bold flex items-center justify-center text-[16px]">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="text-[14px] font-semibold text-[#18181B]">
                  {currentUser.name}
                </div>
                <div className="text-[11px] font-mono text-[#52525B]">
                  {currentUser.studentId} • {currentUser.email}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] p-2.5">
              <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#52525B] mb-2">
                Account access level
              </div>
              <div className="flex gap-2">
                {(["student", "faculty", "admin"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setRole(level)}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium capitalize transition ${
                      role === level
                        ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                        : "border-[#E5E0D8] bg-white text-[#18181B]"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                Full Name
              </label>
              <input
                type="text"
                defaultValue={currentUser.name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                Academic Major / Research Track
              </label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                University / Institution
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-[#D4D4D8] text-[13px]"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-[13px] font-medium cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{loading ? "Saving..." : "Update Profile"}</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLoginOrRegister} className="p-6 space-y-4">
            {error && (
              <div className="p-2.5 rounded bg-[#DC2626]/10 border border-[#DC2626]/30 text-[#DC2626] text-[12px]">
                {error}
              </div>
            )}

            {tab === "register" && (
              <div>
                <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                  Student Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Julian Mercer"
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px]"
                />
              </div>
            )}

            {tab === "register" && (
              <div className="rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] p-2.5">
                <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#52525B] mb-2">
                  Access level
                </div>
                <div className="flex gap-2">
                  {(["student", "faculty", "admin"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setRole(level)}
                      className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium capitalize transition ${
                        role === level
                          ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                          : "border-[#E5E0D8] bg-white text-[#18181B]"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                University Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="clara.vance@columbia.edu"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px]"
              />
            </div>

            {tab !== "reset" && (
              <div>
                <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px]"
                />
              </div>
            )}

            {tab === "reset" && (
              <div>
                <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Choose a new password"
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px]"
                />
              </div>
            )}

            {tab === "register" && (
              <div>
                <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                  Major / Department
                </label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="Computer Science & Neuroscience"
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px]"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="flex flex-col items-start gap-1 text-left">
                <button
                  type="button"
                  onClick={() => setTab(tab === "reset" ? "login" : "reset")}
                  className="text-[11px] font-mono text-[#1E3A8A] underline cursor-pointer"
                >
                  {tab === "reset" ? "Back to sign in" : "Reset password"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("clara.vance@columbia.edu");
                    setPassword("scholar2026");
                  }}
                  className="text-[11px] font-mono text-[#1E3A8A] underline cursor-pointer"
                >
                  Fill Demo Credentials
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1E3A8A] text-white text-[13px] font-medium cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>
                  {loading
                    ? "Authenticating..."
                    : tab === "register"
                    ? "Create Account"
                    : tab === "reset"
                    ? "Update Password"
                    : "Sign In"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
