# BuildRAX.ai — Visual AI Logic Builder

[![Status](https://img.shields.io/badge/Status-Beta-orange.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#)
[![Next.js](https://img.shields.io/badge/Framework-Next.js%2016-black.svg)](https://nextjs.org/)
[![AI](https://img.shields.io/badge/AI-LiteLLM-purple.svg)](#)

> **Learn AI by building it visually.** Create agents, workflows, and AI tools with drag-and-drop blocks. See prompts, memory, tools, and outputs step by step. No black boxes.

---

## 🚀 Overview

BuildRAX.ai is an open-source platform designed to demystify AI agents and workflows. It provides a visual-first interface where users can connect inputs, LLMs, memory modules, and custom tools to build complex automated systems. By making the "hidden" parts of AI transparent—such as prompt construction, vector retrieval, and iterative loops—BuildRAX serves as both a high-productivity tool for developers and a learning platform for AI practitioners.

### Key Value Propositions:
- **Visual First**: Intuitive drag-and-drop canvas for logic building.
- **Learning by Building**: Interactive missions and gamified progression.
- **Total Transparency**: Inspect every step of the AI execution pipeline.
- **Open Source**: Fully extensible and self-hostable.

---

## 🛠 Core Functionalities

### 1. Visual Workflow Builder
Built on top of `@xyflow/react`, the builder allows you to assemble AI logic using a rich library of nodes:
- **Input/Output**: Define entry points and final responses.
- **LLM Nodes**: Configure model selection (GPT-4o, Llama 3, etc.), temperature, and system prompts.
- **Prompt Templates**: Use `{{handle}}` syntax to dynamically inject data from upstream nodes.
- **Memory (Vector Store)**: Integrate RAG (Retrieval-Augmented Generation) by connecting memory nodes to vector databases.
- **Control Flow**: Implement `Conditions` (If/Else) and `Loops` for complex reasoning.
- **Tools**: Execute custom functions or API calls as part of the workflow.

### 2. Topological Execution Engine
A custom engine ([execution-engine.ts](file:///Users/chetanya/BuildRAX.ai/BuildRAX.ai/src/lib/execution-engine.ts)) validates and executes graphs:
- **Cycle Detection**: Uses Kahn’s algorithm to ensure the graph is a Directed Acyclic Graph (DAG).
- **Dependency Management**: Automatically gathers outputs from source handles to feed into downstream node inputs.

### 3. Background Processing
Reliable execution is handled by **Inngest**, ensuring workflows complete even if they take several minutes or require multiple steps.

---

## 🏗 System Architecture

### Frontend Architecture
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Route Groups).
- **Core UI**: React Flow (`@xyflow/react`) for the canvas.
- **Styling**: Tailwind CSS v4 with custom glassmorphism components.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for smooth transitions between nodes and panels.
- **Icons**: Lucide-react.

### Backend Architecture
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) with MongoDB adapter.
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) for orchestration.
  - `User`: Tracks XP, levels, and encrypted API keys.
  - `Workflow`: Stores graph structure (nodes/edges).
  - `Execution`: Logs every run, including time-per-node and error traces.
- **Event-Driven Execution**: [Inngest](https://www.inngest.com/) manages the execution lifecycle and retries.

### AI Integration Layer
- **Unified Interface**: BuildRAX uses a [LiteLLM wrapper](file:///Users/chetanya/BuildRAX.ai/BuildRAX.ai/src/lib/litellm.ts) to support multiple providers (OpenAI, Anthropic, Ollama) through a single API.
- **Encryption**: API keys are stored encrypted to ensure user security.

---

## 🎮 Gamification & Learning

BuildRAX isn't just a tool; it's a game.
- **XP System**: Earn XP for executing workflows, completing lessons, and publishing templates.
- **Leveling**: Progress from "Workflow Creator" up to "AI Architect."
- **Interactive Missions**: Built-in lesson plans that guide users through building their first RAG agent or tool-using bot.

---

## 🗺 Roadmap

### Current AI Systems
- ✅ Multi-model support via LiteLLM.
- ✅ Dynamic prompt engineering nodes.
- ✅ Basic memory integration.
- ✅ Topological workflow execution.

### Future Plans
- 🏗 **Python Execution Nodes**: Run arbitrary Python code blocks within the visual flow.
- 🏗 **Multi-Agent Orchestration**: Native support for agent-to-agent communication.
- 🏗 **Advanced RAG**: Built-in vector embedding and chunking management.
- 🏗 **Agent-as-an-API**: One-click deployment of visual workflows as standard REST endpoints.

---

## 👩‍💻 For Developers & Open Source
BuildRAX is built for hackers.

### Getting Started
1. **Clone & Install**:
   ```bash
   git clone https://github.com/chetanya1998/BuildRAX.ai.git
   cd BuildRAX.ai
   npm install
   ```
2. **Environment Setup**: Copy `.env.example` to `.env.local` and add your `MONGODB_URI` and `OPENAI_API_KEY`.
3. **Run Dev**: `npm run dev`
4. **Inngest Dev**: `npx inngest-cli@latest dev`

### Contributing
We welcome contributions in:
- **New Node Types**: Add nodes for specific APIs or logic.
- **Templates**: Share your best agent workflows.
- **Core Engine**: Improve the execution speed and reliability.

---

## 📜 License
BuildRAX is open-source under the MIT License.
