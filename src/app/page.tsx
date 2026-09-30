"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen,
  Sparkles,
  Search,
  Layers,
  Upload,
  Plus,
  FileText,
  Cpu,
  MessageSquare,
  Trash2,
  SlidersHorizontal,
  Send,
  PanelRightClose,
  PanelRightOpen,
  GraduationCap,
  CheckCircle2,
  Menu,
  X,
  ArrowUpRight,
  FolderPlus,
  UserCheck,
} from "lucide-react";
import type {
  StudentUser,
  CorpusSummary,
  CourseDocument,
  VectorChunk,
  QaSessionItem,
  QaMessageItem,
  SavedNoteItem,
  CitationItem,
  RagTelemetry,
} from "@/types/rag";
import { CitationAnswerRenderer } from "@/components/CitationAnswerRenderer";
import { SourceInspectorDrawer } from "@/components/SourceInspectorDrawer";
import { SemanticVectorExplorer } from "@/components/SemanticVectorExplorer";
import { CorpusAndStudyView } from "@/components/CorpusAndStudyView";
import {
  DocumentModal,
  CorpusModal,
  DocumentReaderModal,
  AuthModal,
} from "@/components/Modals";

type WorkspaceTab = "qa" | "vectors" | "corpus";

export default function RagStudyWorkspacePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<StudentUser | null>(null);
  const [corpora, setCorpora] = useState<CorpusSummary[]>([]);
  const [activeCorpus, setActiveCorpus] = useState<CorpusSummary | null>(null);
  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [chunks, setChunks] = useState<VectorChunk[]>([]);
  const [sessions, setSessions] = useState<QaSessionItem[]>([]);
  const [notes, setNotes] = useState<SavedNoteItem[]>([]);

  // Active Navigation & View State
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("qa");
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Active Inspector Citations & Telemetry State
  const [inspectedCitations, setInspectedCitations] = useState<CitationItem[]>(
    []
  );
  const [inspectedTelemetry, setInspectedTelemetry] =
    useState<RagTelemetry | null>(null);
  const [activeCitationNumber, setActiveCitationNumber] = useState<
    number | null
  >(1);

  // Q&A Query Composer & Hyperparameters State
  const [queryInput, setQueryInput] = useState("");
  const [topK, setTopK] = useState<number>(4);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.55);
  const [retrievalMode, setRetrievalMode] = useState<string>("hybrid");
  const [filterDocId, setFilterDocId] = useState<number>(0);
  const [synthesizing, setSynthesizing] = useState<boolean>(false);
  const [pipelineStage, setPipelineStage] = useState<string>("");

  // Modals State
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<CourseDocument | null>(null);
  const [corpusModalOpen, setCorpusModalOpen] = useState(false);
  const [editingCorpus, setEditingCorpus] = useState<CorpusSummary | null>(
    null
  );
  const [readerDocId, setReaderDocId] = useState<number | null>(null);
  const [readerHighlightChunkId, setReaderHighlightChunkId] = useState<
    number | null
  >(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showWelcomePane, setShowWelcomePane] = useState(true);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const optimisticMessageId = useRef(0);
  const isAdminAccess = user?.role === "admin";

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3400);
  };

  const loadWorkspace = useCallback(
    async (targetCorpusId?: number, preserveSessionId?: number | null) => {
      try {
        const url = targetCorpusId
          ? `/api/workspace?corpusId=${targetCorpusId}`
          : "/api/workspace";
        const res = await fetch(url);
        const data = await res.json();

        if (data.user) setUser(data.user);
        setCorpora(data.corpora || []);
        setActiveCorpus(data.activeCorpus || null);
        setDocuments(data.documents || []);
        setChunks(data.chunks || []);
        const loadedSessions: QaSessionItem[] = data.sessions || [];
        setSessions(loadedSessions);
        setNotes(data.notes || []);

        const chosenSession =
          (preserveSessionId
            ? loadedSessions.find((s) => s.id === preserveSessionId)
            : null) ||
          loadedSessions[0] ||
          null;

        setActiveSessionId(chosenSession ? chosenSession.id : null);

        // Populate right inspector from the most recent assistant message in the session
        if (chosenSession && chosenSession.messages.length > 0) {
          const assistantMsgs = chosenSession.messages.filter(
            (m) => m.role === "assistant" && m.citations && m.citations.length > 0
          );
          const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
          if (lastAssistant) {
            setInspectedCitations(lastAssistant.citations);
            setInspectedTelemetry(lastAssistant.telemetry);
            setActiveCitationNumber(1);
          } else {
            setInspectedCitations([]);
            setInspectedTelemetry(null);
          }
        } else {
          setInspectedCitations([]);
          setInspectedTelemetry(null);
        }
      } catch (err) {
        console.error("Failed to load workspace:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void Promise.resolve().then(() => loadWorkspace());
  }, [loadWorkspace]);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;

  const handleSelectSession = (session: QaSessionItem) => {
    setActiveSessionId(session.id);
    setActiveTab("qa");
    const assistantMsgs = session.messages.filter(
      (m) => m.role === "assistant" && m.citations && m.citations.length > 0
    );
    const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
    if (lastAssistant) {
      setInspectedCitations(lastAssistant.citations);
      setInspectedTelemetry(lastAssistant.telemetry);
      setActiveCitationNumber(1);
    } else {
      setInspectedCitations([]);
      setInspectedTelemetry(null);
    }
  };

  const handleCitationPillClick = (
    citation: CitationItem,
    message: QaMessageItem
  ) => {
    setInspectedCitations(message.citations || []);
    setInspectedTelemetry(message.telemetry || null);
    setActiveCitationNumber(citation.citationNumber);
    setInspectorOpen(true);

    setTimeout(() => {
      const el = document.getElementById(
        `inspector-chunk-${citation.citationNumber}`
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 80);
  };

  const handleSubmitRagQuery = async (
    e?: React.FormEvent,
    overrideQuery?: string
  ) => {
    if (e) e.preventDefault();
    const q = (overrideQuery ?? queryInput).trim();
    if (!q || !activeCorpus || synthesizing) return;

    setQueryInput("");
    setSynthesizing(true);
    setPipelineStage("Embedding query into 64D semantic vector...");

    // Optimistic user message
    const tempUserMsg: QaMessageItem = {
      id: --optimisticMessageId.current,
      sessionId: activeSession?.id || 0,
      role: "user",
      content: q,
      citations: [],
      telemetry: null,
      createdAt: new Date().toISOString(),
    };

    if (activeSession) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? { ...s, messages: [...s.messages, tempUserMsg] }
            : s
        )
      );
    }

    setTimeout(() => {
      setPipelineStage(
        `Scanning ${chunks.length} vector segments (${retrievalMode.toUpperCase()}, k=${topK})...`
      );
    }, 220);

    try {
      const res = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corpusId: activeCorpus.id,
          sessionId: activeSession?.id || null,
          documentId: filterDocId || undefined,
          query: q,
          topK,
          similarityThreshold,
          retrievalMode,
          mode: "qa",
        }),
      });

      const data = await res.json();
      if (res.ok && data.assistantMessage) {
        setInspectedCitations(data.assistantMessage.citations || []);
        setInspectedTelemetry(data.telemetry || null);
        setActiveCitationNumber(1);
        setInspectorOpen(true);
        await loadWorkspace(activeCorpus.id, data.sessionId);
        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        showToast(data.error || "RAG synthesis failed");
      }
    } catch {
      showToast("Error executing RAG query");
    } finally {
      setSynthesizing(false);
      setPipelineStage("");
    }
  };

  const handleNewQaThread = async () => {
    if (!activeCorpus) return;
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        corpusId: activeCorpus.id,
        title: `Study Inquiry #${sessions.length + 1}`,
        topK,
        similarityThreshold,
        retrievalMode,
      }),
    });
    const data = await res.json();
    if (res.ok && data.session) {
      await loadWorkspace(activeCorpus.id, data.session.id);
      setActiveTab("qa");
      showToast("Created new Q&A research thread");
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (!activeCorpus) return;
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    await fetch(`/api/sessions?id=${sessionId}`, { method: "DELETE" });
    await loadWorkspace(activeCorpus.id);
    showToast("Deleted Q&A thread");
  };

  // Document CRUD Handlers
  const handleSaveDocument = async (payload: {
    id?: number;
    corpusId: number;
    title: string;
    docType: string;
    author: string;
    sourceRef: string;
    content: string;
    customChunkSize: number;
    customChunkOverlap: number;
  }) => {
    const isEdit = Boolean(payload.id);
    const res = await fetch("/api/documents", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      await loadWorkspace(payload.corpusId, activeSessionId);
      showToast(
        isEdit
          ? `Re-indexed document into ${data.reindexedChunks} vector chunks`
          : `Indexed "${payload.title}" into ${data.chunksCreated} 64D vector chunks`
      );
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!activeCorpus) return;
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    await fetch(`/api/documents?id=${docId}`, { method: "DELETE" });
    await loadWorkspace(activeCorpus.id, activeSessionId);
    showToast("Removed document and associated vector embeddings");
  };

  // Corpus CRUD Handlers
  const handleSaveCorpus = async (payload: {
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
  }) => {
    const isEdit = Boolean(payload.id);
    const res = await fetch("/api/corpora", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok && data.corpus) {
      await loadWorkspace(data.corpus.id);
      showToast(
        isEdit
          ? `Updated corpus ${data.corpus.code}`
          : `Created corpus ${data.corpus.code}`
      );
    }
  };

  const handleDeleteCorpus = async () => {
    if (!activeCorpus) return;
    if (corpora.length <= 1) {
      showToast("At least one active course corpus is required.");
      return;
    }
    const deletedCode = activeCorpus.code;
    await fetch(`/api/corpora?id=${activeCorpus.id}`, { method: "DELETE" });
    await loadWorkspace();
    showToast(`Deleted corpus ${deletedCode}`);
  };

  // Vector Chunk CRUD Handlers
  const handleCreateChunk = async (payload: {
    documentId: number;
    corpusId: number;
    sectionTitle: string;
    pageNumber: number;
    content: string;
  }) => {
    const res = await fetch("/api/chunks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok && activeCorpus) {
      await loadWorkspace(activeCorpus.id, activeSessionId);
      showToast("Embedded new 64D vector chunk");
    }
  };

  const handleUpdateChunk = async (payload: {
    id: number;
    sectionTitle: string;
    pageNumber: number;
    content: string;
  }) => {
    const res = await fetch("/api/chunks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok && activeCorpus) {
      await loadWorkspace(activeCorpus.id, activeSessionId);
      showToast("Updated chunk & recomputed 64D semantic vector");
    }
  };

  const handleDeleteChunk = async (chunkId: number) => {
    if (!activeCorpus) return;
    setChunks((prev) => prev.filter((c) => c.id !== chunkId));
    await fetch(`/api/chunks?id=${chunkId}`, { method: "DELETE" });
    await loadWorkspace(activeCorpus.id, activeSessionId);
    showToast("Deleted vector chunk");
  };

  // Study Notes / Flashcards CRUD Handlers
  const handleSaveCitationAsNote = async (citation: CitationItem) => {
    if (!activeCorpus) return;
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        corpusId: activeCorpus.id,
        chunkId: citation.chunkId,
        documentTitle: citation.documentTitle,
        question: `Key Concept from ${citation.sectionTitle} (${citation.documentTitle})`,
        answer: citation.excerpt,
        citationRef: `${citation.sectionTitle} • Page ${citation.pageNumber} (${Math.round(
          citation.similarityScore * 100
        )}% Vector Match)`,
        masteryStatus: "reviewing",
      }),
    });
    const data = await res.json();
    if (res.ok && data.note) {
      setNotes((prev) => [data.note, ...prev]);
      showToast("Saved retrieved passage to Study Flashcards");
    }
  };

  const handleCreateNote = async (payload: {
    corpusId: number;
    documentTitle: string;
    question: string;
    answer: string;
    citationRef: string;
    masteryStatus: string;
  }) => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok && data.note) {
      setNotes((prev) => [data.note, ...prev]);
      showToast("Created study flashcard");
    }
  };

  const handleUpdateNote = async (payload: {
    id: number;
    question?: string;
    answer?: string;
    masteryStatus?: string;
  }) => {
    // Optimistic update
    setNotes((prev) =>
      prev.map((n) => (n.id === payload.id ? { ...n, ...payload } : n))
    );
    await fetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    showToast("Updated study flashcard");
  };

  const handleDeleteNote = async (noteId: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    await fetch(`/api/notes?id=${noteId}`, { method: "DELETE" });
    showToast("Removed study flashcard");
  };

  const savedChunkIds = new Set(
    notes.map((n) => n.chunkId).filter((id): id is number => id !== null)
  );

  const suggestedPrompts =
    activeCorpus?.code === "BIO-302"
      ? [
          "How does F0F1-ATP synthase rotational catalysis synthesize ATP from the proton-motive force?",
          "Compare dCas9-TET1 epigenetic demethylation with wild-type CRISPR-Cas9 in post-mitotic neurons.",
          "What are the high-yield bioenergetics formulas and grading weights on the BIO-302 syllabus?",
        ]
      : activeCorpus?.code === "CS-412"
      ? [
          "Explain how Product Quantization (PQ) compresses high-dimensional vector indices.",
          "How does Reciprocal Rank Fusion (RRF) combine Dense Cosine search with Sparse BM25?",
          "Why does section-aware sliding window overlap improve RAG citation faithfulness?",
        ]
      : [
          "How did 18th-century coffeehouses and print networks create Habermas's bourgeois public sphere?",
          "What triggered the 1848 revolutions across Europe and what permanent reform did they achieve?",
          "Contrast Locke's fiduciary theory of government with Rousseau's General Will.",
        ];

  const readerDocument =
    documents.find((d) => d.id === readerDocId) || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center shadow-lg mb-4 animate-pulse">
          <Cpu className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-[22px] font-bold text-[#18181B]">
          Initializing Archival Vector RAG Engine...
        </h2>
        <p className="text-[13px] font-mono text-[#52525B] mt-1">
          Loading 64D semantic embeddings, course corpora & citation indices
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#FAF8F5] text-[#18181B]">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#18181B] text-[#FAF8F5] px-4 py-2.5 rounded-xl shadow-xl border border-[#D97706]/50 flex items-center gap-2.5 text-[13px] font-medium">
          <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main 3-Pane Split Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Backdrop */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          />
        )}

        {/* LEFT SIDEBAR (268px): Course Corpora, Navigation & Document Library */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-[272px] shrink-0 bg-[#F3EFEA] border-r border-[#E5E0D8] flex flex-col justify-between transition-transform duration-200 ${
            mobileSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Top Brand + Course Corpus Switcher */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {/* Brand Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif font-bold text-[17px] tracking-tight text-[#18181B]">
                      VERITAS
                    </span>
                    <span className="px-1.5 py-0.2 text-[9px] font-mono font-semibold uppercase rounded bg-[#D97706]/15 text-[#B45309] border border-[#D97706]/30">
                      RAG v2.4
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-[#52525B]">
                    Vector Q&A Study Desk
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden p-1 text-[#52525B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Course Corpora Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#52525B] px-1">
                <span>Active Course Corpus</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCorpus(null);
                    setCorpusModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-[#1E3A8A] hover:underline font-semibold cursor-pointer"
                >
                  <FolderPlus className="w-3 h-3" />
                  <span>+ New</span>
                </button>
              </div>

              <div className="space-y-1">
                {corpora.map((c) => {
                  const isActive = activeCorpus?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        loadWorkspace(c.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? "bg-[#FAF8F5] text-[#18181B] border border-[#D5CFC4] shadow-2xs border-l-4 border-l-[#1E3A8A]"
                          : "text-[#52525B] hover:bg-[#FAF8F5]/60 hover:text-[#18181B]"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: c.accentColor }}
                          />
                          <span className="font-mono text-[12px] font-bold text-[#18181B]">
                            {c.code}
                          </span>
                        </div>
                        <div className="text-[12px] truncate mt-0.5">
                          {c.title}
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-[#E5E0D8]/80 text-[10px] font-mono text-[#18181B] shrink-0">
                        {c.chunkCount} vecs
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Navigation Modes */}
            <div className="space-y-1 pt-2 border-t border-[#E5E0D8]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#52525B] px-1 mb-1">
                Workspace Mode
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("qa")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                  activeTab === "qa"
                    ? "bg-[#1E3A8A] text-white shadow-xs"
                    : "text-[#27272A] hover:bg-[#FAF8F5]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Q&A Synthesis</span>
                </span>
                <span className="text-[10px] font-mono opacity-80">
                  {sessions.length} threads
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("vectors")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                  activeTab === "vectors"
                    ? "bg-[#1E3A8A] text-white shadow-xs"
                    : "text-[#27272A] hover:bg-[#FAF8F5]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span>Semantic Vector Search</span>
                </span>
                <span className="text-[10px] font-mono opacity-80">
                  {chunks.length} chunks
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("corpus")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                  activeTab === "corpus"
                    ? "bg-[#1E3A8A] text-white shadow-xs"
                    : "text-[#27272A] hover:bg-[#FAF8F5]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Documents & Study Cards</span>
                </span>
                <span className="text-[10px] font-mono opacity-80">
                  {notes.length} cards
                </span>
              </button>
            </div>

            {/* Indexed Document Library in Sidebar */}
            <div className="space-y-2 pt-2 border-t border-[#E5E0D8]">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#52525B] px-1">
                <span>Indexed Documents ({documents.length})</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingDoc(null);
                    setDocModalOpen(true);
                  }}
                  className="text-[#1E3A8A] font-semibold hover:underline cursor-pointer"
                >
                  + Upload
                </button>
              </div>

              <div className="space-y-1 max-h-44 overflow-y-auto pr-0.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setReaderDocId(doc.id);
                      setReaderHighlightChunkId(null);
                    }}
                    className="group px-2.5 py-2 rounded-lg bg-[#FAF8F5]/80 hover:bg-white border border-transparent hover:border-[#E5E0D8] transition-all cursor-pointer flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-[#1E3A8A] mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[12px] font-medium text-[#18181B] truncate group-hover:text-[#1E3A8A]">
                          {doc.title}
                        </div>
                        <div className="text-[10px] font-mono text-[#52525B] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                          <span>{doc.chunkCount} chunks</span>
                          <span>•</span>
                          <span>{doc.docType}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingDoc(null);
                  setDocModalOpen(true);
                }}
                className="w-full py-2 px-3 rounded-lg border border-dashed border-[#1E3A8A]/40 bg-[#FAF8F5] hover:bg-[#1E3A8A] hover:text-white text-[#1E3A8A] text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Index New Course Document</span>
              </button>
            </div>

            {/* Q&A Research Threads List */}
            <div className="space-y-1.5 pt-2 border-t border-[#E5E0D8]">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#52525B] px-1">
                <span>Q&A Study Threads</span>
                <button
                  type="button"
                  onClick={handleNewQaThread}
                  className="text-[#1E3A8A] font-semibold hover:underline cursor-pointer"
                >
                  + New Thread
                </button>
              </div>

              <div className="space-y-1 max-h-36 overflow-y-auto">
                {sessions.map((s) => {
                  const isCurrent = activeSession?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSession(s)}
                      className={`group px-2.5 py-1.5 rounded-md text-[12px] flex items-center justify-between gap-1.5 cursor-pointer ${
                        isCurrent
                          ? "bg-white text-[#18181B] font-medium border border-[#D5CFC4]"
                          : "text-[#52525B] hover:bg-[#FAF8F5] hover:text-[#18181B]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <MessageSquare className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                        <span className="truncate">{s.title}</span>
                      </div>
                      {sessions.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(s.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[#52525B] hover:text-[#DC2626] p-0.5 cursor-pointer"
                          title="Delete Thread"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Student Auth & Profile Bar */}
          <div className="p-3 border-t border-[#E5E0D8] bg-[#FAF8F5]">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#F3EFEA] transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white font-serif font-bold text-[14px] flex items-center justify-center shrink-0">
                  {user?.name ? user.name.charAt(0) : "S"}
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-[#18181B] truncate">
                    {user?.name || "Clara Vance"}
                  </div>
                  <div className="text-[10px] font-mono text-[#52525B] truncate">
                    {user?.studentId || "STU-2026-8841"} • Active
                  </div>
                </div>
              </div>
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#52525B] shrink-0" />
            </button>
          </div>
        </aside>

        {/* CENTER WORKSPACE PANE */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#FAF8F5]">
          {/* Top Context Header & Pipeline Status Bar */}
          <header className="h-14 shrink-0 px-4 lg:px-6 bg-[#FAF8F5]/85 border-b border-[#E5E0D8] flex items-center justify-between gap-3 backdrop-blur-sm">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-md border border-[#E5E0D8] text-[#18181B]"
              >
                <Menu className="w-4 h-4" />
              </button>

              {activeCorpus && (
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-white shrink-0"
                    style={{
                      backgroundColor: activeCorpus.accentColor || "#1E3A8A",
                    }}
                  >
                    {activeCorpus.code}
                  </span>
                  <h1 className="font-serif text-[17px] font-semibold text-[#18181B] truncate">
                    {activeCorpus.title}
                  </h1>
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#059669]/10 text-[#059669] border border-[#059669]/20">
                    <Cpu className="w-3 h-3" />
                    {chunks.length} Vectors ({activeCorpus.totalTokens} tokens)
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Quick Mode Switcher */}
              <div className="hidden sm:flex items-center bg-[#F3EFEA] p-0.5 rounded-lg border border-[#E5E0D8] text-[12px]">
                <button
                  type="button"
                  onClick={() => setActiveTab("qa")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    activeTab === "qa"
                      ? "bg-white text-[#1E3A8A] shadow-2xs"
                      : "text-[#52525B] hover:text-[#18181B]"
                  }`}
                >
                  Q&A Studio
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("vectors")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    activeTab === "vectors"
                      ? "bg-white text-[#1E3A8A] shadow-2xs"
                      : "text-[#52525B] hover:text-[#18181B]"
                  }`}
                >
                  Vector Search
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("corpus")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    activeTab === "corpus"
                      ? "bg-white text-[#1E3A8A] shadow-2xs"
                      : "text-[#52525B] hover:text-[#18181B]"
                  }`}
                >
                  Corpus & Cards ({notes.length})
                </button>
              </div>

              {/* Right Source Inspector Toggle */}
              <button
                type="button"
                onClick={() => setInspectorOpen(!inspectorOpen)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors cursor-pointer ${
                  inspectorOpen
                    ? "bg-[#FEF3C7] text-[#92400E] border-[#D97706]/40"
                    : "bg-white text-[#18181B] border-[#E5E0D8] hover:bg-[#F3EFEA]"
                }`}
                title="Toggle Right Source & Vector Inspector"
              >
                {inspectorOpen ? (
                  <PanelRightClose className="w-4 h-4" />
                ) : (
                  <PanelRightOpen className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Sources</span>
                <span className="font-mono font-bold">
                  [{inspectedCitations.length}]
                </span>
              </button>
            </div>
          </header>

          {/* CENTER CONTENT BY ACTIVE TAB */}
          {activeTab === "qa" && activeCorpus && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 sm:p-6 pb-0">
                <div className="max-w-3xl mx-auto glass-panel rounded-2xl p-4 sm:p-5 overflow-hidden relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(30,58,138,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(217,119,6,0.12),_transparent_25%)]" />
                  <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1E3A8A]/20 bg-[#1E3A8A]/5 px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-[#1E3A8A]">
                        <Sparkles className="w-3 h-3" />
                        {isAdminAccess ? "faculty oversight mode" : "Smart academic workspace"}
                      </span>
                      <div>
                        <h2 className="font-serif text-[26px] leading-tight text-[#18181B]">
                          {user?.name ? `Welcome back, ${user.name}` : "Study with confidence"}
                        </h2>
                        <p className="mt-1 text-[13px] text-[#52525B] max-w-xl">
                          {isAdminAccess
                            ? "Faculty and admin access is enabled. Review corpus health, manage access, and monitor research workflows from a single workspace."
                            : "Sign in to save your study threads, keep your research context, and continue working with source-grounded answers across your archive."}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAuthModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-3.5 py-2 text-[12px] font-medium text-white shadow-sm transition hover:bg-[#152d66]"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {user ? "Profile & login" : "Login / sign in"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowWelcomePane(false)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0D8] bg-white px-3.5 py-2 text-[12px] font-medium text-[#18181B] transition hover:bg-[#F3EFEA]"
                      >
                        <X className="w-3.5 h-3.5" />
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Q&A Synthesis Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-4 space-y-6">
                <div className="max-w-3xl mx-auto space-y-6">
                  {showWelcomePane && (
                    <div className="soft-card rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-mono text-[#1E3A8A] font-semibold uppercase flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          <span>
                            Citation-Grounded RAG Pipeline • {activeCorpus.code}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#52525B]">
                          Every answer embeds your question into 64D vector space, retrieves Top-K course passages, and links inline{" "}
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] font-semibold">
                            [1]
                          </span>{" "}
                          citations to the Source Inspector.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDoc(null);
                          setDocModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#D5CFC4] text-[12px] font-medium text-[#18181B] hover:bg-[#FAF8F5] cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        <span>Add Reading to Corpus</span>
                      </button>
                    </div>
                  )}

                  {/* Messages Thread */}
                  {!activeSession || activeSession.messages.length === 0 ? (
                    <div className="bg-white border border-[#E5E0D8] rounded-xl p-8 text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center mx-auto">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-serif text-[20px] font-semibold text-[#18181B]">
                          Ask a Grounded Question in {activeCorpus.code}
                        </h3>
                        <p className="text-[13.5px] text-[#52525B] max-w-lg mx-auto">
                          Select a research question below or type your own query to run semantic retrieval across{" "}
                          {chunks.length} vector chunks.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 max-w-xl mx-auto pt-2">
                        {suggestedPrompts.map((prompt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              handleSubmitRagQuery(undefined, prompt)
                            }
                            className="p-3 rounded-lg bg-[#FAF8F5] hover:bg-[#FEF3C7]/60 border border-[#E5E0D8] text-left text-[13px] text-[#18181B] flex items-center justify-between gap-2 transition-colors cursor-pointer"
                          >
                            <span>{prompt}</span>
                            <ArrowUpRight className="w-4 h-4 text-[#D97706] shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    activeSession.messages.map((msg) => {
                      if (msg.role === "user") {
                        return (
                          <div key={msg.id} className="flex justify-end">
                            <div className="max-w-2xl bg-[#1E3A8A] text-white px-5 py-3.5 rounded-2xl rounded-tr-xs shadow-xs">
                              <div className="text-[10px] font-mono uppercase tracking-wider opacity-75 mb-1">
                                Student Query • {user?.name || "Scholar"}
                              </div>
                              <p className="text-[15px] leading-relaxed font-medium">
                                {msg.content}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      // Assistant RAG Synthesis Card
                      const isInspectedTurn =
                        inspectedCitations.length > 0 &&
                        msg.citations?.[0]?.chunkId ===
                          inspectedCitations[0]?.chunkId;

                      return (
                        <div
                          key={msg.id}
                          onClick={() => {
                            if (msg.citations && msg.citations.length > 0) {
                              setInspectedCitations(msg.citations);
                              setInspectedTelemetry(msg.telemetry);
                            }
                          }}
                          className={`bg-white rounded-xl border transition-all p-6 space-y-4 shadow-xs ${
                            isInspectedTurn
                              ? "border-[#1E3A8A]/50 ring-1 ring-[#1E3A8A]/15"
                              : "border-[#E5E0D8]"
                          }`}
                        >
                          {/* Pipeline Step Telemetry Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E0D8] text-[11px] font-mono">
                            <div className="flex flex-wrap items-center gap-1.5 text-[#52525B]">
                              <span className="inline-flex items-center gap-1 text-[#059669] font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Query Embedded (
                                {msg.telemetry?.embedLatencyMs ?? 8}ms)
                              </span>
                              <span>→</span>
                              <span className="text-[#1E3A8A] font-semibold">
                                {msg.citations?.length || 0} Vectors Retrieved (
                                {msg.telemetry?.retrievalLatencyMs ?? 14}ms)
                              </span>
                              <span>→</span>
                              <span className="text-[#D97706] font-semibold">
                                Context Synthesized
                              </span>
                            </div>

                            {msg.citations && msg.citations.length > 0 && (
                              <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] font-semibold">
                                Peak Cosine:{" "}
                                {(
                                  msg.citations[0].similarityScore * 100
                                ).toFixed(1)}
                                %
                              </span>
                            )}
                          </div>

                          {/* Rendered Answer with Interactive [1], [2] Citations */}
                          <CitationAnswerRenderer
                            content={msg.content}
                            citations={msg.citations || []}
                            activeCitationNumber={
                              isInspectedTurn ? activeCitationNumber : null
                            }
                            onCitationClick={(cit) =>
                              handleCitationPillClick(cit, msg)
                            }
                          />

                          {/* Retrieved Source Pills Strip at Bottom of Turn */}
                          {msg.citations && msg.citations.length > 0 && (
                            <div className="pt-3 border-t border-[#E5E0D8] space-y-2">
                              <div className="text-[11px] font-mono text-[#52525B] uppercase">
                                Grounded Vector Citations (Click to inspect source passage):
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {msg.citations.map((cit) => {
                                  const isSelected =
                                    isInspectedTurn &&
                                    activeCitationNumber === cit.citationNumber;
                                  return (
                                    <button
                                      key={cit.citationNumber}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCitationPillClick(cit, msg);
                                      }}
                                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] border transition-all cursor-pointer ${
                                        isSelected
                                          ? "bg-[#FEF3C7] border-[#D97706] text-[#18181B] font-semibold shadow-2xs"
                                          : "bg-[#FAF8F5] border-[#E5E0D8] text-[#27272A] hover:border-[#D97706]"
                                      }`}
                                    >
                                      <span className="font-mono font-bold text-[#D97706]">
                                        [{cit.citationNumber}]
                                      </span>
                                      <span className="truncate max-w-[180px]">
                                        {cit.sectionTitle}
                                      </span>
                                      <span className="font-mono text-[11px] text-[#059669]">
                                        {(cit.similarityScore * 100).toFixed(0)}
                                        %
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Live Pipeline Progress Indicator when Synthesizing */}
                  {synthesizing && (
                    <div className="bg-white rounded-xl border border-[#1E3A8A]/40 p-5 flex items-center gap-3.5 shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white flex items-center justify-center animate-spin">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-[#18181B]">
                          Executing RAG Vector Retrieval & Synthesis...
                        </div>
                        <div className="text-[11px] font-mono text-[#1E3A8A]">
                          {pipelineStage}
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Sticky Bottom RAG Query Composer & Hyperparameter Bar */}
              <div className="p-4 bg-[#FAF8F5] border-t border-[#E5E0D8]">
                <div className="max-w-3xl mx-auto space-y-2.5">
                  {/* Follow-up Quick Prompts */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <span className="text-[11px] font-mono text-[#52525B] shrink-0">
                      Prompts:
                    </span>
                    {suggestedPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSubmitRagQuery(undefined, p)}
                        className="px-2.5 py-1 rounded-full text-[11px] bg-[#F3EFEA] hover:bg-[#FEF3C7] text-[#18181B] border border-[#E5E0D8] whitespace-nowrap transition-colors cursor-pointer"
                      >
                        {p.length > 58 ? `${p.slice(0, 58)}...` : p}
                      </button>
                    ))}
                  </div>

                  {/* Query Form */}
                  <form
                    onSubmit={(e) => handleSubmitRagQuery(e)}
                    className="bg-white rounded-xl border border-[#D4D4D8] focus-within:border-[#1E3A8A] focus-within:ring-2 focus-within:ring-[#1E3A8A]/15 shadow-xs overflow-hidden"
                  >
                    {/* Retrieval Hyperparameters Strip */}
                    <div className="px-3.5 py-2 bg-[#F3EFEA]/70 border-b border-[#E5E0D8] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-1.5 text-[#52525B]">
                          <span>Scope:</span>
                          <select
                            value={filterDocId}
                            onChange={(e) =>
                              setFilterDocId(Number(e.target.value))
                            }
                            className="bg-white px-2 py-0.5 rounded border border-[#D5CFC4] text-[#18181B]"
                          >
                            <option value={0}>
                              All Corpus Docs ({documents.length})
                            </option>
                            {documents.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.title.slice(0, 32)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="flex items-center gap-1.5 text-[#52525B]">
                          <span>Retriever:</span>
                          <select
                            value={retrievalMode}
                            onChange={(e) => setRetrievalMode(e.target.value)}
                            className="bg-white px-2 py-0.5 rounded border border-[#D5CFC4] text-[#1E3A8A] font-semibold"
                          >
                            <option value="hybrid">Hybrid Dense+BM25</option>
                            <option value="dense_cosine">
                              Dense Cosine 64D
                            </option>
                            <option value="mmr_diverse">MMR Diversity</option>
                          </select>
                        </label>

                        <label className="flex items-center gap-1.5 text-[#52525B]">
                          <span>Top-K:</span>
                          <select
                            value={topK}
                            onChange={(e) => setTopK(Number(e.target.value))}
                            className="bg-white px-1.5 py-0.5 rounded border border-[#D5CFC4] text-[#18181B]"
                          >
                            <option value={2}>k=2</option>
                            <option value={3}>k=3</option>
                            <option value={4}>k=4</option>
                            <option value={6}>k=6</option>
                          </select>
                        </label>
                      </div>

                      <div className="flex items-center gap-1.5 text-[#52525B]">
                        <span>Min Cosine:</span>
                        <input
                          type="number"
                          min={0.35}
                          max={0.85}
                          step={0.05}
                          value={similarityThreshold}
                          onChange={(e) =>
                            setSimilarityThreshold(Number(e.target.value))
                          }
                          className="w-14 bg-white px-1.5 py-0.5 rounded border border-[#D5CFC4] text-[#059669] font-semibold"
                        />
                      </div>
                    </div>

                    {/* Input Row */}
                    <div className="flex items-center px-3.5 py-2.5 gap-2">
                      <input
                        type="text"
                        value={queryInput}
                        onChange={(e) => setQueryInput(e.target.value)}
                        placeholder={`Ask a question grounded in ${activeCorpus.code} documents (e.g., mechanisms, equations, primary sources)...`}
                        className="flex-1 text-[14px] bg-transparent text-[#18181B] placeholder:text-[#71717A] focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={synthesizing || !queryInput.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-[13px] font-medium hover:bg-[#1E3A8A]/90 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Retrieve & Answer</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === "vectors" && activeCorpus && (
            <div className="flex-1 overflow-y-auto">
              <SemanticVectorExplorer
                corpus={activeCorpus}
                documents={documents}
                chunks={chunks}
                onRunVectorSearch={async (params) => {
                  const res = await fetch("/api/rag/query", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      corpusId: activeCorpus.id,
                      ...params,
                      mode: "search_only",
                    }),
                  });
                  return res.json();
                }}
                onCreateChunk={handleCreateChunk}
                onUpdateChunk={handleUpdateChunk}
                onDeleteChunk={handleDeleteChunk}
                onAskAboutChunk={(ch) => {
                  setActiveTab("qa");
                  handleSubmitRagQuery(
                    undefined,
                    `Explain the key concepts and mechanisms in ${ch.sectionTitle} from "${ch.documentTitle}".`
                  );
                }}
                onSaveChunkAsNote={handleSaveCitationAsNote}
              />
            </div>
          )}

          {activeTab === "corpus" && activeCorpus && (
            <div className="flex-1 overflow-y-auto">
              <CorpusAndStudyView
                corpus={activeCorpus}
                documents={documents}
                notes={notes}
                onOpenNewDocModal={() => {
                  setEditingDoc(null);
                  setDocModalOpen(true);
                }}
                onEditDocument={(doc) => {
                  setEditingDoc(doc);
                  setDocModalOpen(true);
                }}
                onDeleteDocument={handleDeleteDocument}
                onOpenDocumentReader={(docId) => {
                  setReaderDocId(docId);
                  setReaderHighlightChunkId(null);
                }}
                onEditCorpus={() => {
                  setEditingCorpus(activeCorpus);
                  setCorpusModalOpen(true);
                }}
                onDeleteCorpus={handleDeleteCorpus}
                onCreateNote={handleCreateNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
              />
            </div>
          )}
        </main>

        {/* RIGHT SOURCE & VECTOR INSPECTOR DRAWER */}
        <SourceInspectorDrawer
          isOpen={inspectorOpen}
          onClose={() => setInspectorOpen(false)}
          citations={inspectedCitations}
          telemetry={inspectedTelemetry}
          activeCitationNumber={activeCitationNumber}
          onSelectCitationNumber={(num) => setActiveCitationNumber(num)}
          onOpenDocumentReader={(docId, chunkId) => {
            setReaderDocId(docId);
            setReaderHighlightChunkId(chunkId ?? null);
          }}
          onSaveCitationAsNote={handleSaveCitationAsNote}
          savedChunkIds={savedChunkIds}
        />
      </div>

      {/* MODALS */}
      {activeCorpus && (
        <DocumentModal
          key={editingDoc ? `edit-doc-${editingDoc.id}` : "new-doc"}
          isOpen={docModalOpen}
          onClose={() => {
            setDocModalOpen(false);
            setEditingDoc(null);
          }}
          corpus={activeCorpus}
          initialDoc={editingDoc}
          onSave={handleSaveDocument}
        />
      )}

      <CorpusModal
        key={editingCorpus ? `edit-corpus-${editingCorpus.id}` : "new-corpus"}
        isOpen={corpusModalOpen}
        onClose={() => {
          setCorpusModalOpen(false);
          setEditingCorpus(null);
        }}
        initialCorpus={editingCorpus}
        onSave={handleSaveCorpus}
      />

      <DocumentReaderModal
        isOpen={Boolean(readerDocId && readerDocument)}
        onClose={() => {
          setReaderDocId(null);
          setReaderHighlightChunkId(null);
        }}
        document={readerDocument}
        chunks={chunks}
        highlightChunkId={readerHighlightChunkId}
        onEditDocument={(doc) => {
          setEditingDoc(doc);
          setDocModalOpen(true);
        }}
        onDeleteDocument={handleDeleteDocument}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={user}
        onAuthSuccess={(updatedUser) => {
          setUser(updatedUser);
          showToast(`Signed in as ${updatedUser.name}`);
        }}
      />
    </div>
  );
}
