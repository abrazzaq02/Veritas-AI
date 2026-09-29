import { db } from "@/db";
import {
  users,
  corpora,
  documents,
  documentChunks,
  qaSessions,
  qaMessages,
  savedNotes,
} from "@/db/schema";
import {
  chunkDocumentContent,
  retrieveTopChunks,
  synthesizeRagAnswer,
  type ChunkCandidate,
} from "@/lib/rag-engine";
import { count, eq } from "drizzle-orm";

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (seedPromise) {
    return seedPromise;
  }
  seedPromise = runSeed().finally(() => {
    seedPromise = null;
  });
  return seedPromise;
}

async function runSeed(): Promise<void> {
  const existingCorpora = await db.select({ value: count() }).from(corpora);
  if ((existingCorpora[0]?.value ?? 0) > 0) {
    return;
  }

  // 1. Create Demo Student User
  let userId: number;
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, "clara.vance@columbia.edu"));

  if (existingUsers.length > 0) {
    userId = existingUsers[0].id;
  } else {
    const [createdUser] = await db
      .insert(users)
      .values({
        name: "Clara Vance",
        email: "clara.vance@columbia.edu",
        passwordHash: "scholar2026",
        studentId: "STU-2026-8841",
        major: "Computational Neurobiology & CS",
        university: "Columbia Archival Research Institute",
        avatarColor: "#1E3A8A",
      })
      .returning();
    userId = createdUser.id;
  }

  // 2. Define 3 Academic Course Corpora
  const [bioCorpus, csCorpus, histCorpus] = await db
    .insert(corpora)
    .values([
      {
        userId,
        code: "BIO-302",
        title: "Cellular Neurobiology & Bioenergetics",
        professor: "Prof. Elena Rostova, Ph.D.",
        semester: "Spring 2026",
        description:
          "Advanced study of mitochondrial oxidative phosphorylation, chemiosmotic proton gradients, synaptic plasticity (LTP), and neural gene regulation.",
        embeddingModel: "text-embedding-3-scholar-64d",
        chunkSize: 480,
        chunkOverlap: 75,
        accentColor: "#1E3A8A",
      },
      {
        userId,
        code: "CS-412",
        title: "Vector Databases & RAG Architecture",
        professor: "Prof. Marcus Chen, Ph.D.",
        semester: "Spring 2026",
        description:
          "High-dimensional vector similarity search, HNSW graph indexing, hybrid dense + BM25 retrieval pipelines, and grounded LLM citation synthesis.",
        embeddingModel: "text-embedding-3-scholar-64d",
        chunkSize: 480,
        chunkOverlap: 75,
        accentColor: "#059669",
      },
      {
        userId,
        code: "HIST-204",
        title: "Modern European Intellectual History",
        professor: "Prof. Julian Sterling, D.Phil.",
        semester: "Spring 2026",
        description:
          "Primary source seminar examining Enlightenment political theory, print culture, steam industrialization, and the constitutional revolutions of 1848.",
        embeddingModel: "text-embedding-3-scholar-64d",
        chunkSize: 480,
        chunkOverlap: 75,
        accentColor: "#D97706",
      },
    ])
    .returning();

  // 3. Seed Documents & Vector Chunks for BIO-302
  const bioDocs = [
    {
      corpusId: bioCorpus.id,
      title: "Lecture 04: Mitochondrial ATP Synthesis & Chemiosmotic Coupling.pdf",
      docType: "Lecture Notes",
      author: "Prof. Elena Rostova",
      sourceRef: "Pages 42–58 • Week 4 Bioenergetics",
      content: `# §4.1 Electron Transport Chain & Redox Couples
Mitochondrial oxidative phosphorylation begins as high-energy electrons harvested from glycolysis and the citric acid cycle are donated by NADH (to Complex I, NADH dehydrogenase) and FADH2 (to Complex II, succinate dehydrogenase). As electrons pass sequentially through ubiquinone (Coenzyme Q), Complex III (cytochrome bc1), cytochrome c, and finally Complex IV (cytochrome c oxidase, which reduces molecular O2 to H2O), free energy is released at three proton-pumping complexes (I, III, and IV).

# §4.2 Chemiosmotic Coupling & Proton-Motive Force
Peter Mitchell's chemiosmotic hypothesis demonstrates that electron transport is energetically coupled to ATP synthesis via an electrochemical proton gradient across the impermeable inner mitochondrial membrane. Pumping H+ ions from the mitochondrial matrix into the intermembrane space establishes two additive components: a chemical pH gradient (Delta pH, matrix alkaline ~7.8 vs intermembrane ~7.0) and an electrical transmembrane potential (Delta Psi, ~160 to 180 mV negative inside the matrix). Together these constitute the proton-motive force (PMF, approx. 200 mV).

# §4.3 Rotational Catalysis of F0F1-ATP Synthase
F0F1-ATP synthase (Complex V) harnesses the thermodynamic backflow of protons down their electrochemical gradient. Protons enter the membrane-embedded F0 c-ring channel, driving mechanical 360-degree rotation of the central gamma-epsilon stalk at up to 100 revolutions per second. This asymmetric rotation induces sequential conformational transitions in the catalytic F1 beta-subunits (Open -> Loose -> Tight states), catalyzing the endergonic condensation of ADP + Pi into ATP. Approximately 3 to 4 H+ ions are translocated per ATP molecule synthesized.

# §4.4 Uncoupling Agents & Thermogenesis (UCP1 vs DNP)
Chemical uncouplers such as 2,4-dinitrophenol (DNP) and physiological uncoupling protein 1 (UCP1, thermogenin in brown adipose tissue) act as lipid-soluble protonophores or proton channels that short-circuit the inner mitochondrial membrane. By allowing H+ to re-enter the matrix bypassing F0F1-ATP synthase, the proton-motive force is dissipated as thermal energy (non-shivering thermogenesis). Consequently, oxygen consumption and NADH oxidation accelerate maximally while mitochondrial ATP production drops sharply.`,
    },
    {
      corpusId: bioCorpus.id,
      title: "Lecture 07: Synaptic Transmission, NMDA Receptors & LTP.md",
      docType: "Lecture Notes",
      author: "Prof. Elena Rostova",
      sourceRef: "Pages 88–104 • Week 7 Neurophysiology",
      content: `# §7.1 Presynaptic Action Potential & Ca2+-Triggered Exocytosis
When an action potential propagates to the presynaptic axon terminal, membrane depolarization opens voltage-gated Ca2+ channels (P/Q- and N-type). Rapid influx of extracellular Ca2+ raises local microdomain calcium concentration from 100 nM to over 20 uM. Calcium binds to synaptotagmin-1 on synaptic vesicles, catalyzing SNARE complex (synaptobrevin, syntaxin-1, SNAP-25) zippering and millisecond vesicle fusion to release glutamate into the synaptic cleft.

# §7.2 AMPA vs. NMDA Receptor Coincidence Detection
At excitatory hippocampal CA3-CA1 synapses, released glutamate binds both AMPA and NMDA ionotropic receptors on the postsynaptic dendritic spine. At resting membrane potential (-70 mV), AMPA receptors conduct Na+ inward to generate fast excitatory postsynaptic potentials (EPSPs), whereas NMDA receptor pores remain physically occluded by extracellular Mg2+ ions. Only when high-frequency tetanus stimulation produces strong postsynaptic depolarization is the voltage-dependent Mg2+ block expelled, making the NMDA receptor a molecular Hebbian coincidence detector requiring both presynaptic glutamate and postsynaptic depolarization.

# §7.3 CaMKII Activation & Long-Term Potentiation (LTP)
Unblocking of NMDA receptors permits substantial postsynaptic Ca2+ influx into the dendritic spine, activating Calcium/Calmodulin-dependent Protein Kinase II (CaMKII). Autophosphorylation of CaMKII at Thr286 locks the enzyme in an autonomous active state. Activated CaMKII phosphorylates existing AMPA receptors (increasing single-channel conductance) and drives exocytic insertion of additional AMPA receptor vesicles into the postsynaptic density, strengthening synaptic efficacy for hours to weeks.`,
    },
    {
      corpusId: bioCorpus.id,
      title: "Paper Review: CRISPR-dCas9 Epigenetic Editing in Neurons.pdf",
      docType: "Research Paper",
      author: "Liu et al. (Cell Neuro, 2025)",
      sourceRef: "Journal Club Module • Pages 1–14",
      content: `# §1.1 Catalytically Dead Cas9 (dCas9) Epigenome Editors
Unlike wild-type CRISPR-Cas9 nuclease which introduces double-stranded DNA breaks (risking p53-mediated toxicity in post-mitotic neurons), catalytically inactive dCas9 (harboring D10A and H840A mutations) retains programmable sgRNA-guided DNA binding without cleavage. Fusing dCas9 to TET1 catalytic domain (dCas9-TET1) enables targeted demethylation of 5-methylcytosine (5mC) at silenced neuronal promoter CpG islands such as BDNF exon IV.

# §1.2 Chromatin Remodeling & Transcriptional Rescue
In primary cortical neurons, delivery of dCas9-p300 catalyzes histone H3 lysine 27 acetylation (H3K27ac) at distal enhancers, shifting heterochromatin into transcriptionally permissive euchromatin. Single-cell RNA-seq confirms a 4.2-fold upregulation of endogenous BDNF expression with minimal off-target genomic perturbation.`,
    },
    {
      corpusId: bioCorpus.id,
      title: "BIO-302 Syllabus, Exam Rubric & Bioenergetics Formulas.txt",
      docType: "Syllabus & Exam Guide",
      author: "Department of Biological Sciences",
      sourceRef: "Syllabus • Spring 2026",
      content: `# §1.0 Course Assessment & Midterm Rubric
Midterm Exam (35% of final grade) covers Modules 1–7 (Bioenergetics, Membrane Potential, and Synaptic Plasticity). Problem sets account for 25%, Laboratory CRISPR Design Report for 20%, and the Final Synthesis Exam for 20%. Students must show full thermodynamic derivations for Nernst equilibrium potential and Gibbs free energy of ion transport.

# §2.0 High-Yield Equations for Exam 1
1. Nernst Potential: E_ion = (RT / zF) * ln([Ion]_out / [Ion]_in), which simplifies at 37°C to 61.5 mV / z * log10([Ion]_out / [Ion]_in).
2. Proton-Motive Force (PMF): Delta p = Delta Psi - (2.3 * RT / F) * Delta pH = Delta Psi - 61.5 * Delta pH (in mV).
3. ATP Yield Stoichiometry: Complete aerobic oxidation of 1 molecule of glucose yields ~30 to 32 ATP (2.5 ATP per mitochondrial NADH, 1.5 ATP per FADH2).`,
    },
  ];

  const csDocs = [
    {
      corpusId: csCorpus.id,
      title: "Module 02: Dense Vector Embeddings, Cosine Similarity & HNSW.pdf",
      docType: "Lecture Notes",
      author: "Prof. Marcus Chen",
      sourceRef: "Pages 18–34 • Vector Indexing",
      content: `# §2.1 Dense Semantic Vector Representations
Modern bi-encoder embedding models project variable-length text passages into fixed-dimensional unit hyperspheres (e.g., R^384 or R^1536). Unlike sparse bag-of-words representations where synonyms occupy orthogonal axes, dense transformer embeddings map semantically equivalent concepts ("mitochondrial proton gradient" and "chemiosmotic H+ potential") to proximate angular coordinates. When vectors are L2-normalized (||v||_2 = 1), cosine similarity cos(theta) = (A · B) / (||A|| ||B||) reduces to a fast inner dot product.

# §2.2 HNSW (Hierarchical Navigable Small World) Graph Indexing
Exhaustive brute-force k-NN search scales linearly O(N * d), becoming prohibitive at millions of chunks. Hierarchical Navigable Small World (HNSW) constructs a multi-layer proximity graph inspired by skip lists. Top layers contain sparse long-range highway edges for rapid coarse navigation, while layer 0 contains dense local neighborhood links. Greedy beam search (controlled by efSearch and M max-connections) achieves >98% recall@10 in sub-millisecond O(log N) query latency.

# §2.3 Product Quantization (PQ) & Memory Footprint
Storing 10 million 1536-dimensional float32 vectors requires ~61.4 GB of RAM. Product Quantization decomposes each D-dimensional vector into M subvectors of dimension D/M, quantizing each subspace via k-means centroids (typically 256 centroids = 1 byte code). Asymmetric Distance Computation (ADC) estimates distances directly from lookup tables, compressing memory by 16x–32x with minimal recall degradation.`,
    },
    {
      corpusId: csCorpus.id,
      title: "Module 05: Hybrid RAG, Reciprocal Rank Fusion & Grounding.md",
      docType: "Research Paper",
      author: "Chen & Patel (SysML 2026)",
      sourceRef: "Pages 1–19 • RAG Architecture",
      content: `# §5.1 Semantic Chunking & Boundary Overlap
Document chunking directly governs RAG retrieval precision. Fixed token windows without overlap frequently sever antecedent nouns from consequent clauses or split mathematical equations from their variable definitions. Recursive section-aware chunking (400–512 tokens with 15–20% sliding window overlap) preserves local discourse coherence while keeping embeddings focused on a single atomic proposition.

# §5.2 Hybrid Retrieval & Reciprocal Rank Fusion (RRF)
Dense vector embeddings excel at conceptual paraphrase matching but can underperform on exact identifiers, course codes, chemical formulas, or rare acronyms (e.g., "CaMKII Thr286" or "BIO-302"). Hybrid RAG executes parallel Dense Cosine ANN search and Sparse BM25 lexical scoring, combining ranked lists via Reciprocal Rank Fusion: RRF_score(d) = sum_{r in Retrievers} 1 / (k + rank_r(d)), where k = 60 stabilizes outlier ranks.

# §5.3 Context Grounding & Citation Verification
To prevent parametric hallucination during synthesis, the generator prompt enforces strict attribution constraints: every factual assertion must terminate with a bracketed source pointer [1], [2] mapping to a retrieved chunk ID. Post-generation NLI (Natural Language Inference) entailment checks verify that each cited span entails the generated sentence.`,
    },
  ];

  const histDocs = [
    {
      corpusId: histCorpus.id,
      title: "Chapter 03: Enlightenment Sovereignty & the Print Public Sphere.pdf",
      docType: "Textbook Chapter",
      author: "Prof. Julian Sterling",
      sourceRef: "Pages 64–89 • Week 3 Seminar",
      content: `# §3.1 Lockean Constitutionalism vs. Rousseau's General Will
Eighteenth-century European political thought fractured over the locus of legitimate sovereignty. John Locke's Second Treatise grounded civil government in the preservation of pre-political natural rights (life, liberty, and estate) via revocable fiduciary consent. Conversely, Jean-Jacques Rousseau's Du Contrat Social (1762) rejected representative parliamentary delegation, arguing that authentic civic freedom requires the alienation of particular self-interest into the indivisible General Will (volonte generale) of the sovereign citizenry.

# §3.2 Habermas, Print Capitalism & the Bourgeois Public Sphere
Jurgen Habermas's structural analysis traces how 18th-century metropolitan coffeehouses in London, Parisian salons, and transnational periodical networks forged an autonomous bourgeois public sphere. Within these spaces, royal fiscal policy and ecclesiastical dogma were subjected to rational-critical debate by a reading public, eroding the arcane monopoly of absolutist statecraft decades before 1789.`,
    },
    {
      corpusId: histCorpus.id,
      title: "Archive Dossier: Steam Mechanization & the 1848 Revolutions.md",
      docType: "Research Paper",
      author: "Oxford Historical Archive",
      sourceRef: "Dossier 14 • Pages 102–118",
      content: `# §4.1 Coal, Steam Power & Lancashire Textile Urbanization
The transition from proto-industrial cottage putting-out systems to centralized steam-powered spinning mules (Crompton's mule and Watt's rotary steam engine) detached manufacturing from seasonal river valleys and concentrated labor in coal-adjacent industrial cities like Manchester. Between 1780 and 1840, British raw cotton consumption rose twenty-fold while urban working-class districts faced acute sanitation crises and 14-hour factory shifts.

# §4.2 The Springtime of Peoples: 1848 Constitutional Revolutions
Triggered by agrarian harvest failures (1845–1847), industrial unemployment, and liberal demands for representative constitutions, revolutionary barricades erupted across Paris, Vienna, Berlin, and Milan in early 1848. Although conservative monarchies recovered executive control by 1849 due to fractures between moderate constitutional liberals and radical urban artisans, 1848 permanently abolished feudal seigneurial dues in Central Europe.`,
    },
  ];

  const allDocsToInsert = [...bioDocs, ...csDocs, ...histDocs];
  const insertedBioChunks: ChunkCandidate[] = [];
  const insertedCsChunks: ChunkCandidate[] = [];
  const insertedHistChunks: ChunkCandidate[] = [];

  for (const docData of allDocsToInsert) {
    const words = docData.content.trim().split(/\s+/).length;
    const segments = chunkDocumentContent(docData.content, 480, 75);

    const [createdDoc] = await db
      .insert(documents)
      .values({
        corpusId: docData.corpusId,
        title: docData.title,
        docType: docData.docType,
        author: docData.author,
        sourceRef: docData.sourceRef,
        content: docData.content,
        status: "indexed",
        wordCount: words,
        chunkCount: segments.length,
        embeddingDimensions: 64,
      })
      .returning();

    for (const seg of segments) {
      const [createdChunk] = await db
        .insert(documentChunks)
        .values({
          documentId: createdDoc.id,
          corpusId: docData.corpusId,
          chunkIndex: seg.chunkIndex,
          sectionTitle: seg.sectionTitle,
          pageNumber: seg.pageNumber,
          content: seg.content,
          tokenCount: seg.tokenCount,
          keywords: seg.keywords,
          embedding: seg.embedding,
          vectorNorm: seg.vectorNorm,
        })
        .returning();

      const candidate: ChunkCandidate = {
        id: createdChunk.id,
        documentId: createdDoc.id,
        documentTitle: createdDoc.title,
        docType: createdDoc.docType,
        chunkIndex: createdChunk.chunkIndex,
        sectionTitle: createdChunk.sectionTitle,
        pageNumber: createdChunk.pageNumber,
        content: createdChunk.content,
        tokenCount: createdChunk.tokenCount,
        keywords: createdChunk.keywords,
        embedding: createdChunk.embedding,
      };

      if (docData.corpusId === bioCorpus.id) insertedBioChunks.push(candidate);
      if (docData.corpusId === csCorpus.id) insertedCsChunks.push(candidate);
      if (docData.corpusId === histCorpus.id) insertedHistChunks.push(candidate);
    }
  }

  // 4. Create Initial Citation-Linked Q&A Sessions & Messages for each Corpus
  const bioQ1 =
    "How does the proton-motive force drive ATP synthesis in F0F1-ATP synthase, and how do uncouplers like UCP1 or DNP affect this process?";
  const bioRet1 = retrieveTopChunks(bioQ1, insertedBioChunks, {
    topK: 4,
    similarityThreshold: 0.55,
    retrievalMode: "hybrid",
  });
  const bioAns1 = await synthesizeRagAnswer(bioQ1, bioRet1.results, {
    code: bioCorpus.code,
    title: bioCorpus.title,
    retrievalMode: "hybrid",
    similarityThreshold: 0.55,
  });

  const bioQ2 =
    "Why is the NMDA receptor considered a Hebbian coincidence detector during Long-Term Potentiation (LTP)?";
  const bioRet2 = retrieveTopChunks(bioQ2, insertedBioChunks, {
    topK: 3,
    similarityThreshold: 0.55,
    retrievalMode: "hybrid",
  });
  const bioAns2 = await synthesizeRagAnswer(bioQ2, bioRet2.results, {
    code: bioCorpus.code,
    title: bioCorpus.title,
    retrievalMode: "hybrid",
    similarityThreshold: 0.55,
  });

  const [bioSession] = await db
    .insert(qaSessions)
    .values({
      corpusId: bioCorpus.id,
      userId,
      title: "Midterm Review: Chemiosmotic Coupling & Synaptic LTP",
      topK: 4,
      similarityThreshold: 0.55,
      retrievalMode: "hybrid",
    })
    .returning();

  await db.insert(qaMessages).values([
    {
      sessionId: bioSession.id,
      role: "user",
      content: bioQ1,
      citations: [],
      telemetry: null,
    },
    {
      sessionId: bioSession.id,
      role: "assistant",
      content: bioAns1.answer,
      citations: bioAns1.citations,
      telemetry: {
        ...bioAns1.telemetry,
        totalChunksScanned: insertedBioChunks.length,
      },
    },
    {
      sessionId: bioSession.id,
      role: "user",
      content: bioQ2,
      citations: [],
      telemetry: null,
    },
    {
      sessionId: bioSession.id,
      role: "assistant",
      content: bioAns2.answer,
      citations: bioAns2.citations,
      telemetry: {
        ...bioAns2.telemetry,
        totalChunksScanned: insertedBioChunks.length,
      },
    },
  ]);

  // CS-412 Q&A Session
  const csQ1 =
    "How does HNSW graph indexing accelerate vector search compared to brute-force cosine similarity, and why combine it with BM25 in Hybrid RAG?";
  const csRet1 = retrieveTopChunks(csQ1, insertedCsChunks, {
    topK: 4,
    similarityThreshold: 0.55,
    retrievalMode: "hybrid",
  });
  const csAns1 = await synthesizeRagAnswer(csQ1, csRet1.results, {
    code: csCorpus.code,
    title: csCorpus.title,
    retrievalMode: "hybrid",
    similarityThreshold: 0.55,
  });

  const [csSession] = await db
    .insert(qaSessions)
    .values({
      corpusId: csCorpus.id,
      userId,
      title: "HNSW Vector Indexing & Hybrid BM25 Fusion",
      topK: 4,
      similarityThreshold: 0.55,
      retrievalMode: "hybrid",
    })
    .returning();

  await db.insert(qaMessages).values([
    {
      sessionId: csSession.id,
      role: "user",
      content: csQ1,
      citations: [],
      telemetry: null,
    },
    {
      sessionId: csSession.id,
      role: "assistant",
      content: csAns1.answer,
      citations: csAns1.citations,
      telemetry: {
        ...csAns1.telemetry,
        totalChunksScanned: insertedCsChunks.length,
      },
    },
  ]);

  // HIST-204 Q&A Session
  const histQ1 =
    "Compare Locke's fiduciary consent with Rousseau's General Will and explain how print culture shaped the 18th-century public sphere.";
  const histRet1 = retrieveTopChunks(histQ1, insertedHistChunks, {
    topK: 3,
    similarityThreshold: 0.55,
    retrievalMode: "hybrid",
  });
  const histAns1 = await synthesizeRagAnswer(histQ1, histRet1.results, {
    code: histCorpus.code,
    title: histCorpus.title,
    retrievalMode: "hybrid",
    similarityThreshold: 0.55,
  });

  const [histSession] = await db
    .insert(qaSessions)
    .values({
      corpusId: histCorpus.id,
      userId,
      title: "Enlightenment Sovereignty & Habermas Public Sphere",
      topK: 3,
      similarityThreshold: 0.55,
      retrievalMode: "hybrid",
    })
    .returning();

  await db.insert(qaMessages).values([
    {
      sessionId: histSession.id,
      role: "user",
      content: histQ1,
      citations: [],
      telemetry: null,
    },
    {
      sessionId: histSession.id,
      role: "assistant",
      content: histAns1.answer,
      citations: histAns1.citations,
      telemetry: {
        ...histAns1.telemetry,
        totalChunksScanned: insertedHistChunks.length,
      },
    },
  ]);

  // 5. Seed Saved Citation Flashcards / Study Notes
  await db.insert(savedNotes).values([
    {
      corpusId: bioCorpus.id,
      chunkId: insertedBioChunks[1]?.id ?? null,
      documentTitle:
        "Lecture 04: Mitochondrial ATP Synthesis & Chemiosmotic Coupling.pdf",
      question:
        "What are the two additive thermodynamic components of the Mitochondrial Proton-Motive Force (PMF)?",
      answer:
        "1) The chemical proton gradient (Delta pH, matrix alkaline ~7.8 vs intermembrane ~7.0) and 2) The electrical transmembrane potential (Delta Psi, ~160–180 mV negative inside matrix), totaling ~200 mV.",
      citationRef: "§4.2 Chemiosmotic Coupling • Page 1",
      masteryStatus: "mastered",
    },
    {
      corpusId: bioCorpus.id,
      chunkId: insertedBioChunks[5]?.id ?? null,
      documentTitle:
        "Lecture 07: Synaptic Transmission, NMDA Receptors & LTP.md",
      question:
        "What relieves the extracellular Mg2+ block from postsynaptic NMDA receptors during LTP induction?",
      answer:
        "Strong postsynaptic depolarization driven by high-frequency AMPA receptor Na+ influx expels the voltage-dependent Mg2+ ion from the NMDA channel pore, allowing Ca2+ entry to activate CaMKII.",
      citationRef: "§7.2 AMPA vs. NMDA Coincidence Detection • Page 1",
      masteryStatus: "reviewing",
    },
    {
      corpusId: csCorpus.id,
      chunkId: insertedCsChunks[1]?.id ?? null,
      documentTitle:
        "Module 02: Dense Vector Embeddings, Cosine Similarity & HNSW.pdf",
      question:
        "How does HNSW achieve O(log N) approximate nearest neighbor search over high-dimensional embeddings?",
      answer:
        "HNSW builds a hierarchical multi-layer small-world proximity graph where upper layers have sparse long-range skip edges for fast coarse routing and layer 0 has dense local neighborhood links.",
      citationRef: "§2.2 HNSW Graph Indexing • Page 1",
      masteryStatus: "mastered",
    },
    {
      corpusId: histCorpus.id,
      chunkId: insertedHistChunks[0]?.id ?? null,
      documentTitle:
        "Chapter 03: Enlightenment Sovereignty & the Print Public Sphere.pdf",
      question:
        "How does Rousseau's General Will differ from Locke's theory of representative consent?",
      answer:
        "Locke grounds government in fiduciary protection of natural rights via representative consent, whereas Rousseau argues sovereignty is indivisible and requires alienating private interest into the collective General Will.",
      citationRef: "§3.1 Lockean Constitutionalism vs. Rousseau • Page 1",
      masteryStatus: "reviewing",
    },
  ]);
}
