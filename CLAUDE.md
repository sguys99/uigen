# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. It uses Claude AI (Anthropic) to generate React components that render in real-time through a virtual file system—no files are written to disk. The app supports both anonymous users (sessionStorage) and authenticated users (SQLite database).

## Critical Reference Files

**ALWAYS reference these files when working on related tasks:**

### Database Schema (`/prisma/schema.prisma`)
**This is the single source of truth for database structure.** Always check this file when:
- Working with database queries or mutations
- Adding new fields or models
- Understanding data relationships
- Debugging data persistence issues
- Creating Server Actions that access the database

The schema defines:
- `User` model: Authentication data (id, email, password hash)
- `Project` model: Stored projects with VFS state and chat history (messages, data as JSON)
- Relationships: User → Projects (one-to-many)

Generated Prisma client location: `/src/generated/prisma`

## Development Commands

### Setup
```bash
npm run setup                    # Install deps + generate Prisma client + run migrations
```

### Development
```bash
npm run dev                      # Start dev server with Turbopack at localhost:3000
npm run dev:daemon               # Start dev server in background, logs to logs.txt
```

### Testing & Build
```bash
npm test                         # Run Vitest tests
npm run build                    # Production build
npm run lint                     # ESLint
```

### Database
```bash
npx prisma generate              # Regenerate Prisma client (after schema changes)
npx prisma migrate dev           # Create and apply migration
npm run db:reset                 # Reset database (WARNING: deletes all data)
npx prisma studio                # Open database GUI
```

### Running Individual Tests
```bash
npm test -- path/to/test.ts      # Run specific test file
npm test -- -t "test name"       # Run tests matching pattern
```

## Architecture Overview

### Core Data Flow

```
User Message → ChatContext → /api/chat → Claude AI (with tools)
                                             ↓
                                    AI calls str_replace_editor
                                             ↓
                                    FileSystemContext updates VFS
                                             ↓
                                    PreviewFrame transforms & renders
```

### Virtual File System (VFS)

**Location**: `/src/lib/file-system.ts`

The VFS is an in-memory file tree that:
- Stores all generated component files (Map-based structure)
- Serializes to JSON for database persistence (`Project.data` field)
- Never writes to actual disk
- Supports editor operations: create, view, str_replace, insert, delete, rename
- Auto-creates parent directories

**Important**: When working with file operations, always use VFS methods. The AI interacts with VFS through two tools defined in `/src/lib/tools/`:
- `str_replace_editor`: File creation/editing (commands: view, create, str_replace, insert, undo_edit)
- `file_manager`: Rename/delete operations

### AI Component Generation Pipeline

**Entry Point**: `/src/app/api/chat/route.ts`

1. Receives user message + serialized VFS state + projectId
2. Prepends system prompt from `/src/lib/prompts/generation.tsx` (with ephemeral caching)
3. Streams response using Vercel AI SDK's `streamText()`
4. Claude uses tools to modify VFS
5. `onFinish` hook persists to database (if authenticated)

**AI Provider**: `/src/lib/provider.ts`
- With `ANTHROPIC_API_KEY`: Uses Claude Haiku 4.5
- Without API key: Falls back to `MockLanguageModel` (returns static templates)

**System Prompt Key Points** (`/src/lib/prompts/generation.tsx`):
- Always create `/App.jsx` as entry point
- Use `@/` import alias for local files (maps to `/`)
- Style with Tailwind CSS only
- Operating on virtual root filesystem

### Preview System

**Location**: `/src/components/preview/PreviewFrame.tsx`

**Transformation Pipeline**:
1. Collect all files from VFS
2. Transform JSX → ES modules using Babel standalone (`/src/lib/transform/jsx-transformer.ts`)
3. Create blob URLs for each transformed file
4. Generate import map:
   - Third-party: `https://esm.sh/{package}`
   - Local files: blob URLs with alias resolution (`@/`, `./`, `/`)
   - Missing imports: placeholder React components
5. Inject into iframe's `srcdoc` with Tailwind CDN

**Refresh Trigger**: VFS changes increment `refreshTrigger` state, causing preview regeneration.

**Entry Point Priority**: `/App.jsx` > `/App.tsx` > first file alphabetically

### Authentication System

**Session Management**: `/src/lib/auth.ts`
- JWT tokens stored in HTTP-only cookies (`auth-token`)
- 7-day expiration, HS256 signing with JOSE
- Passwords hashed with bcrypt (10 rounds)

**Authorization Layers**:
1. **Middleware** (`/src/middleware.ts`): Protects `/api/projects/*`, `/api/filesystem/*`
2. **Server Actions** (`/src/actions/`): Each validates session via `getSession()`
3. **Page Components**: Redirect unauthenticated users

**Anonymous Users**:
- Work tracked in sessionStorage (`/src/lib/anon-work-tracker.ts`)
- Can use full app functionality
- Prompted to sign up via `HeaderActions` component
- On signup, anonymous work saved to new project

### Database Schema

**Location**: `/prisma/schema.prisma`

```prisma
User {
  id: cuid
  email: unique (indexed)
  password: bcrypt hash
  projects: Project[]
}

Project {
  id: cuid
  name: string
  userId: string? (nullable for anonymous)
  messages: JSON string (chat history)
  data: JSON string (VirtualFileSystem state)
}
```

**Generated Client**: `/src/generated/prisma` (configured in schema.prisma output)

**Persistence Pattern**: Projects store complex data as JSON strings—parsed on read, stringified on write.

## Key Patterns & Conventions

### 1. Context-Based State Management

Two primary contexts wrap the app (see `/src/lib/contexts/`):

```tsx
<FileSystemProvider>      {/* Manages VFS, file operations, refreshTrigger */}
  <ChatProvider>          {/* Manages AI chat, messages, streaming */}
    <App />
  </ChatProvider>
</FileSystemProvider>
```

**FileSystemContext**:
- Wraps `VirtualFileSystem` class
- `handleToolCall()`: Executes AI tool calls and updates VFS
- `triggerRefresh()`: Increments counter to force preview re-render
- `selectedFile`: Currently viewed file path

**ChatContext**:
- Uses Vercel AI SDK's `useChat()` hook
- Serializes VFS in request body
- `onToolCall` handler delegates to FileSystemContext

### 2. Server Actions Pattern

All data mutations use Next.js Server Actions (`"use server"`):
- `/src/actions/index.ts`: Auth (signup, signin, signout)
- `/src/actions/create-project.ts`: Project creation
- `/src/actions/get-project.ts`: Project fetching
- `/src/actions/delete-project.ts`: Project deletion

**Always**:
1. Validate session first via `getSession()`
2. Scope queries to `userId` for security
3. Use Prisma for database access
4. Call `revalidatePath()` for cache updates

### 3. Import Alias Convention

**All internal imports use `@/` prefix**:
```typescript
import { VirtualFileSystem } from "@/lib/file-system"
import { Button } from "@/components/ui/button"
```

Configured in `tsconfig.json` to map to `/src`.

**In generated components** (AI creates these):
- `@/` imports resolve to virtual filesystem root (not `/src`)
- Example: `import Button from "@/components/Button.jsx"`

### 4. File Organization

```
/src
├── app/                  # Next.js App Router (pages, layouts, API routes)
│   ├── api/chat/        # AI chat streaming endpoint
│   └── [projectId]/     # Dynamic project routes
├── components/
│   ├── auth/            # SignupForm, SigninForm
│   ├── chat/            # ChatInterface, ChatMessage
│   ├── editor/          # CodeEditor (Monaco), FileTree
│   ├── preview/         # PreviewFrame, ErrorDisplay
│   └── ui/              # shadcn/ui components
├── lib/
│   ├── contexts/        # FileSystemContext, ChatContext
│   ├── tools/           # AI tool implementations
│   ├── transform/       # JSX → ES module transformer
│   ├── prompts/         # AI system prompts
│   ├── file-system.ts   # VirtualFileSystem class
│   ├── auth.ts          # Session management
│   └── provider.ts      # Claude/Mock provider
├── actions/             # Server Actions for mutations
├── hooks/               # Custom React hooks
└── generated/prisma/    # Generated Prisma client
```

### 5. Streaming AI Pattern

The chat endpoint uses Vercel AI SDK's streaming:

```typescript
const result = streamText({
  model,
  messages,
  tools: { str_replace_editor, file_manager },
  onFinish: async ({ response }) => {
    // Persist to database after completion
  }
})
```

- Tokens stream to UI in real-time
- Tool calls executed during stream via `onToolCall`
- UI updates immediately (no waiting for completion)

### 6. Resizable Panels Layout

Uses `react-resizable-panels` for flexible UI:

```tsx
<ResizablePanelGroup horizontal>
  <ResizablePanel>Chat</ResizablePanel>
  <ResizableHandle />
  <ResizablePanel>
    {/* Tabs: Preview | Code */}
    {isCodeView && (
      <ResizablePanelGroup horizontal>
        <ResizablePanel>FileTree</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>MonacoEditor</ResizablePanel>
      </ResizablePanelGroup>
    )}
  </ResizablePanel>
</ResizablePanelGroup>
```

### 7. Type Safety

- Strict TypeScript enabled (`tsconfig.json`)
- Prisma generates fully typed database client
- Vercel AI SDK provides typed message/tool schemas
- Define interfaces for all data structures

## Common Development Scenarios

### Adding a New AI Tool

1. Create tool definition in `/src/lib/tools/your-tool.ts`:
   ```typescript
   import { tool } from "ai"
   import { z } from "zod"

   export const yourTool = tool({
     description: "...",
     parameters: z.object({ ... }),
     execute: async ({ param }) => {
       // Implementation
       return "Result shown to AI"
     }
   })
   ```

2. Add to `/src/app/api/chat/route.ts`:
   ```typescript
   const result = streamText({
     tools: { str_replace_editor, file_manager, yourTool }
   })
   ```

3. Update system prompt in `/src/lib/prompts/generation.tsx` if needed

### Modifying the VFS

**Core class**: `/src/lib/file-system.ts`

When adding new VFS operations:
1. Add method to `VirtualFileSystem` class
2. Update `serialize()`/`deserialize()` if changing structure
3. Add corresponding tool if AI needs access
4. Update FileSystemContext if React state needs updating

**Important**: Always call `triggerRefresh()` after VFS mutations to update preview.

### Changing Database Schema

1. Edit `/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your_migration_name`
3. Restart dev server (Prisma client auto-regenerates)

**Note**: Generated client outputs to `/src/generated/prisma` (custom location).

### Adding Preview Transform Features

**Transform pipeline**: `/src/lib/transform/jsx-transformer.ts`

This uses `@babel/standalone` to transform JSX → ES modules:
- Modify `transformJSX()` function
- Update import resolution in `resolveImports()`
- Handle new file types in `createImportMap()`

**Debugging transforms**: Check browser console in preview iframe.

### Extending Authentication

**Session utils**: `/src/lib/auth.ts`

To add fields to session:
1. Update `SessionPayload` interface
2. Modify `createSession()` to include new fields
3. Update `verifySession()` decoding
4. Add to JWT payload in signin/signup actions

## Tech Stack Versions

- **Next.js**: 15.3.3 (App Router)
- **React**: 19.0.0
- **TypeScript**: 5.x
- **Vercel AI SDK**: 4.3.16
- **Anthropic SDK**: 1.2.12 (Claude Haiku 4.5)
- **Prisma**: 6.10.1
- **Tailwind CSS**: v4
- **Monaco Editor**: 4.7.0
- **Babel Standalone**: 7.27.6

## Environment Variables

```bash
# Optional - falls back to MockLanguageModel if not set
ANTHROPIC_API_KEY=your-api-key-here

# Optional - uses secure random secret if not set (dev only)
SESSION_SECRET=your-secret-for-jwt
```

## Testing

**Framework**: Vitest with Testing Library

**Config**: `/vitest.config.mts`

- Tests colocated with source files or in `__tests__/` directories
- Use `@testing-library/react` for component tests
- Use `@testing-library/user-event` for interactions
- JSDOM environment for DOM testing

## Import Map & Preview Security

The preview iframe uses:
- **Sandbox attribute**: `allow-scripts allow-same-origin allow-forms`
- **Import maps**: For blob URL + esm.sh resolution
- **Tailwind CDN**: `https://cdn.tailwindcss.com`
- **React from esm.sh**: Version automatically resolved

**Security note**: `allow-same-origin` is required for import maps with blob URLs. The iframe is isolated but can access its own origin.

## Route Structure

```
/                              # Home (anonymous) or dashboard (authenticated)
/[projectId]                   # Project workspace (chat + preview/code)
/api/chat                      # POST - AI streaming endpoint
/api/projects                  # GET - List user projects (auth required)
/api/projects/[id]             # DELETE - Delete project (auth required)
/api/filesystem/load           # POST - Load project files (auth required)
```

**Dynamic routing**: Project ID in URL allows direct links to projects.

## Key Dependencies

- **@ai-sdk/anthropic**: Claude AI integration
- **ai**: Vercel AI SDK for streaming & tools
- **@babel/standalone**: Browser JSX transformation
- **@monaco-editor/react**: VS Code editor
- **@prisma/client**: Type-safe database client
- **jose**: JWT signing/verification
- **bcrypt**: Password hashing
- **react-resizable-panels**: Split pane UI
- **react-markdown**: Chat message rendering
- **lucide-react**: Icon library
- **@radix-ui/***: Headless UI components (via shadcn/ui)

## Performance Considerations

- **Turbopack**: Enabled for faster dev builds (`--turbopack` flag)
- **Ephemeral Caching**: System prompt cached by Anthropic API
- **Blob URLs**: Avoid repeated file reads, created once per refresh
- **React 19**: Concurrent rendering for better UX
- **SQLite**: Lightweight database, no external service needed
