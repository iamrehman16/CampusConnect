# Academic Resource Management & AI Chat System (Server)

A robust, enterprise-grade NestJS backend designed for academic resource sharing, moderation, and AI-powered document intelligence. This system integrates advanced Retrieval-Augmented Generation (RAG) capabilities to allow users to interact with uploaded academic materials through a conversational interface.

---

## 🚀 Features

### 1. **Resource Moderation & Management**
- **Contribution Workflow**: Students and Contributors can upload academic resources (Notes, Slides, Assignments, etc.).
- **Admin Control**: Comprehensive moderation system with approval/rejection workflows and automated deletion.
- **Search & Filtering**: Advanced query builder for searching resources by subject, course, semester, and type.
- **File Processing**: Automated file type detection (PDF, DOC, PPT, etc.) and metadata extraction.

### 2. **AI-Powered Intelligence (RAG)**
- **Document Ingestion**: Seamless parsing of academic documents using LlamaParse.
- **Vector Storage**: High-performance semantic search powered by Qdrant.
- **Semantic Search**: Retrieval of relevant context using Gemini embeddings.
- **Conversational AI**: Multi-model integration with Groq (Llama-3.3-70b/3.1-8b) for context-aware academic support.
- **Session Persistence**: Persistent chat sessions stored in MongoDB.

### 3. **Secure Authentication & Role-Based Access Control**
- **JWT-Based Security**: Dual-token authentication (Access & Refresh tokens) with Passport.js.
- **RBAC**: Fine-grained permissions for `Admin`, `Contributor`, and `Student` roles.
- **User Management**: Administrative tools for managing user status, roles, and profiles.

### 4. **Infrastructure & Storage**
- **Cloud-Native Storage**: Asset management and optimized delivery via Cloudinary.
- **Database**: Flexible document storage using MongoDB (Mongoose).
- **Event-Driven**: Decoupled processes using `@nestjs/event-emitter`.

---

## 🛠️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Database**: [MongoDB](https://www.mongodb.com/) via Mongoose
- **Vector DB**: [Qdrant](https://qdrant.tech/)
- **AI Models**: 
  - **LLMs**: Groq (Llama-3.3-70b-versatile, Llama-3.1-8b-instant)
  - **Embeddings**: Google Gemini (gemini-embedding-001)
  - **Parsing**: Llama Cloud (LlamaParse)
- **Auth**: Passport.js (JWT & Refresh Strategy)
- **Storage**: Cloudinary
- **Communication**: Socket.io (WebSocket support)

## 💰 Zero-Cost Enterprise Architecture

This project is engineered for **$0/month infrastructure costs** while maintaining production-level performance. It demonstrates that enterprise-grade AI applications can be built without a massive cloud budget by strategically leveraging elite free-tier services:

- **LLM Compute ($0)**: Utilizes **Groq Cloud** for ultra-fast inference on Llama-3 models with generous free-tier rate limits.
- **Database & Storage ($0)**: 
  - **MongoDB Atlas**: Managed document storage on the shared free cluster.
  - **Cloudinary**: Generous free tier for media and document hosting.
- **Vector Search ($0)**: **Qdrant Cloud** free tier for high-performance semantic retrieval.
- **AI Intelligence ($0)**: **Google Gemini API** for state-of-the-art embeddings and **LlamaParse** for complex document extraction.
- **Strategic Optimization**: Every component is selected to maximize free-tier quotas through efficient caching, optimized token usage, and event-driven processing.

---

## 🏗️ Implementation & Development Patterns

This project follows strict software engineering principles to ensure scalability and maintainability:

- **Modular Architecture**: Functionality is divided into domain-specific modules (Auth, User, Resource, AI, Dashboard, Storage).
- **Domain-Driven Design (DDD) Principles**: Logic is isolated within specific domains to prevent tight coupling.
- **Builder Pattern**: Utilized in `ResourceQueryBuilder` for dynamic and complex database queries.
- **Event-Driven Architecture**: Used for side effects (e.g., triggering document ingestion after resource approval) to keep controllers lean.
- **Data Transfer Objects (DTOs)**: Rigorous validation using `class-validator` and `class-transformer`.
- **Custom Pipes & Decorators**: Encapsulation of common logic like `IsMongoIdPipe` and RBAC decorators (`@Roles`).
- **Configuration Management**: Centralized configuration using `@nestjs/config`.
- **Standardized Error Handling**: Unified error response shapes across all endpoints.

---

## 📂 Project Structure

```text
src/
├── auth/           # JWT strategies, guards, and auth logic
├── common/         # Global pipes, decorators, and interfaces
├── modules/
│   ├── ai/         # RAG pipeline, embeddings, and chat services
│   ├── auth/       # Authentication domain
│   ├── dashboard/  # Admin statistics
│   ├── post/       # Community discussion system
│   ├── resource/   # Resource upload and moderation
│   ├── storage/    # Cloudinary integration
│   └── user/       # User profiles and management
└── main.ts         # Application entry point
```

---

## ⚙️ Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in the required API keys.
   ```bash
   cp .env.example .env
   ```

4. **Run the application**:
   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

---

## 📖 API Documentation

The server exposes a global prefix `/api`. Major base paths include:
- `POST /api/auth/register`: Register new users.
- `POST /api/auth/login`: Authenticate and receive tokens.
- `GET /api/resources`: List and search resources (Public).
- `POST /api/resources`: Upload new resource (Contributor/Admin).
- `PATCH /api/admin/resources/:id/approve`: Approve a resource (Admin).
- `POST /api/ai/chat`: Interactive chat with academic context.

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 📜 License
[UNLICENSED](LICENSE)
