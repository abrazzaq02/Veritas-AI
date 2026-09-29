# 🧠 Veritas-AI

### AI-Powered Retrieval-Augmented Generation (RAG) Study Workspace

**Veritas-AI** is an intelligent academic study platform designed to help students interact with course materials using **Retrieval-Augmented Generation (RAG)**.

Instead of simply generating answers from a language model, Veritas-AI retrieves relevant information from indexed course documents and uses those sources to generate contextual answers with **citations and source inspection**.

> **Learn from your own course material. Ask questions. Retrieve evidence. Study smarter.**

---

## ✨ Features

### 🤖 AI-Powered Q&A
Ask natural-language questions about your course material and receive contextual answers generated from the indexed knowledge base.

### 🔎 Retrieval-Augmented Generation
Veritas-AI uses a RAG pipeline to:

1. Process the user's question
2. Convert the query into a semantic representation
3. Search relevant document chunks
4. Retrieve the most relevant sources
5. Generate a grounded response
6. Display supporting citations

### 📚 Course Corpus Management
Create and manage multiple academic course corpora.

Each corpus can contain:

- Course code
- Course title
- Professor
- Semester
- Description
- Documents
- Indexed vector chunks

### 📄 Document Indexing
Add course documents and transform their content into searchable semantic chunks.

Documents can be:

- Added
- Edited
- Re-indexed
- Deleted
- Read through the integrated document reader

### 🧩 Semantic Vector Explorer
Explore the indexed document chunks and their semantic representations through the vector workspace.

Veritas-AI currently works with **64-dimensional semantic vectors** for its retrieval pipeline.

### 🔗 Citation & Source Inspection
AI-generated answers are connected to their retrieved sources.

Users can inspect:

- Source document
- Section
- Page number
- Retrieved excerpt
- Similarity score
- Retrieval telemetry

This makes the generated answers easier to verify against the original study material.

### 🎯 Configurable Retrieval
The retrieval pipeline provides controls for:

- `Top-K` results
- Similarity threshold
- Retrieval mode
- Document-level filtering

The application supports a hybrid retrieval workflow combining semantic and keyword-oriented retrieval strategies.

### 📝 Study Flashcards
Important retrieved passages can be saved as study notes or flashcards.

Flashcards include:

- Question
- Answer
- Source document
- Citation reference
- Mastery status

### 💬 Q&A Sessions
Create separate research/study threads for different questions and topics.

Sessions can be:

- Created
- Selected
- Continued
- Deleted

### 📱 Responsive Workspace
The application provides a multi-pane academic workspace with responsive navigation for desktop and mobile environments.

---

## 🏗️ Architecture

At a high level, Veritas-AI follows a **Retrieval-Augmented Generation architecture**:

```text
                    ┌──────────────────┐
                    │      Student     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │    User Query    │
                    └────────┬─────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Query Representation│
                  └──────────┬──────────┘
                             │
                             ▼
              ┌─────────────────────────────┐
              │      Retrieval Pipeline     │
              │                             │
              │  Dense Semantic Retrieval   │
              │          +                  │
              │      Sparse/BM25 Search     │
              └─────────────┬───────────────┘
                            │
                            ▼
                  ┌─────────────────────┐
                  │ Relevant Doc Chunks │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │   RAG Synthesis     │
                  └──────────┬──────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │ Answer + Citations       │
                │ + Retrieval Telemetry    │
                └──────────────────────────┘
```

---

## 🖥️ Workspace

Veritas-AI is organized around three primary workspace modes:

### 1. AI Q&A Synthesis

Interact with course material through natural-language questions and receive source-grounded answers.

### 2. Semantic Vector Explorer

Inspect indexed vector chunks and explore the semantic retrieval layer.

### 3. Corpus & Study

Manage course corpora, documents, study notes, and learning resources.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** | Full-stack React framework |
| **React 19** | User interface |
| **TypeScript** | Type-safe development |
| **PostgreSQL** | Persistent database |
| **Drizzle ORM** | Database ORM and schema management |
| **Tailwind CSS 4** | UI styling |
| **Lucide React** | Interface icons |
| **ESLint** | Code quality |
| **PostCSS** | CSS processing |

---

## 📂 Project Structure

```text
Veritas-AI/
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── workspace/
│   │   │   ├── rag/
│   │   │   ├── documents/
│   │   │   ├── corpora/
│   │   │   ├── chunks/
│   │   │   ├── notes/
│   │   │   └── sessions/
│   │   │
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── CitationAnswerRenderer
│   │   ├── SourceInspectorDrawer
│   │   ├── SemanticVectorExplorer
│   │   ├── CorpusAndStudyView
│   │   └── Modals
│   │
│   └── types/
│       └── rag.ts
│
├── drizzle.config.json
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js**
- **npm**
- **PostgreSQL**
- A configured database connection

---

### 1. Clone the Repository

```bash
git clone https://github.com/abrazzaq02/Veritas-AI.git
```

Navigate into the project:

```bash
cd Veritas-AI
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file in the project root.

```env
DATABASE_URL="postgresql://username:password@localhost:5432/veritas_ai"
```

> Add any additional environment variables required by your local configuration.

---

### 4. Configure the Database

Make sure your PostgreSQL database is running and your `DATABASE_URL` is correctly configured.

Then run the required database migration/schema commands according to your Drizzle configuration.

---

### 5. Start the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 📜 Available Scripts

```bash
npm run dev
```

Starts the development server.

```bash
npm run build
```

Creates a production build.

```bash
npm start
```

Starts the production server.

```bash
npm run lint
```

Runs ESLint.

```bash
npm run typecheck
```

Runs the TypeScript type checker.

---

## 🔬 RAG Pipeline

The core idea behind Veritas-AI is to ground AI responses in the user's own academic material.

### Document Ingestion

```text
Course Document
      │
      ▼
Text Processing
      │
      ▼
Document Chunking
      │
      ▼
Semantic Vector Generation
      │
      ▼
Vector Index
```

### Query Processing

```text
Student Question
      │
      ▼
Query Vectorization
      │
      ▼
Hybrid Retrieval
      │
      ├── Dense Semantic Search
      │
      └── Sparse Keyword Search
      │
      ▼
Relevant Chunks
      │
      ▼
RAG Answer Synthesis
      │
      ▼
Answer + Citations
```

---

## 🎓 Example Use Cases

Veritas-AI can be used for:

- 📖 Course revision
- 🔍 Researching lecture material
- 🧠 Understanding difficult concepts
- 📝 Creating study notes
- 🎯 Preparing for examinations
- 📚 Exploring large collections of course documents
- 🔗 Verifying AI responses against source material
- 🗂️ Organizing multiple academic courses

---

## 🔐 Source-Grounded Learning

One of the main goals of Veritas-AI is to make AI-assisted learning more **traceable and verifiable**.

Rather than treating an AI-generated response as the final authority, the application provides access to the retrieved evidence behind the response.

This allows students to:

> **Ask → Retrieve → Verify → Learn**

---

## 🚀 Future Improvements

Potential future development areas include:

- [ ] PDF and DOCX direct upload
- [ ] Improved embedding models
- [ ] Persistent vector database integration
- [ ] Advanced reranking
- [ ] Streaming AI responses
- [ ] Authentication and role-based access
- [ ] Collaborative course workspaces
- [ ] Automatic quiz generation
- [ ] AI-generated flashcards
- [ ] Spaced-repetition learning
- [ ] Export notes and citations
- [ ] Advanced analytics and learning progress
- [ ] Multilingual academic support

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

### Fork the repository

```bash
git fork https://github.com/abrazzaq02/Veritas-AI
```

### Create a feature branch

```bash
git checkout -b feature/your-feature
```

### Commit your changes

```bash
git commit -m "Add your feature"
```

### Push the branch

```bash
git push origin feature/your-feature
```

Then open a Pull Request.



## ⭐ Support

If you find **Veritas-AI** useful, consider giving the repository a ⭐ on GitHub.

---

### 💡 Veritas-AI

**An intelligent study workspace that brings your academic knowledge base and AI together — with retrieval, evidence, and citations at the center.**
