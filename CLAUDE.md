# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server:**
```bash
npm run dev
```
Runs Vite dev server on port 8080 with hot reload.

**Build for production:**
```bash
npm run build
```

**Build for development:**
```bash
npm run build:dev
```

**Lint code:**
```bash
npm run lint
```
Uses ESLint with TypeScript configuration. Note: `@typescript-eslint/no-unused-vars` is disabled in config.

**Preview production build:**
```bash
npm run preview
```

## Project Architecture

### Tech Stack
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite with SWC
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Routing**: React Router DOM
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios

### Application Structure
This is a Twilio call management dashboard with the following main features:
- Phone number management with audio responses
- Text blast campaigns
- Call logs and analytics
- Settings management

**Main Routes:**
- `/` - Main dashboard with tabbed interface
- `*` - 404 NotFound page

**Core Components:**
- `PhoneNumbersManager` - Manages Twilio phone numbers and audio responses
- `TextBlastManager` - Handles text blast campaigns  
- `CallLogsManager` - Displays call logs and analytics
- `SettingsManager` - Application settings

### Directory Structure
```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components (50+ components)
│   └── *.tsx           # Business logic components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── pages/              # Route components
├── services/           # API services
└── App.tsx             # Main app with providers
```

### API Integration
**Base URL:** `https://www.myapp.com/api/v1/calling`

**Key Endpoints:**
- `GET /get-all-numbers` - Retrieve all phone number mappings
- `POST /add-number` - Add new phone number with audio and text content

**Data Models:**
- `NumberMapping` - Phone number with audio URL and text content
- `CallLog` - Call history records
- `AddNumberRequest` - New number creation payload

Mock data is available in `src/services/api.ts` for development.

### Component Development Patterns
- Use TypeScript with strict typing
- Leverage shadcn/ui components from `@/components/ui/`
- Follow Tailwind CSS utility classes for styling
- Use `@/` path alias for imports
- Form validation with Zod schemas
- TanStack Query for API state management

### UI System
- **Design System**: shadcn/ui with "default" style and "slate" base color
- **Theme**: CSS variables-based theming with dark mode support
- **Icons**: Lucide React
- **Notifications**: Sonner + shadcn/ui toaster
- **Responsive**: Tailwind responsive utilities

### Configuration Files
- `components.json` - shadcn/ui configuration
- `tailwind.config.ts` - Extended Tailwind with custom colors and animations
- `vite.config.ts` - Vite config with @ path alias and development tagging
- `eslint.config.js` - TypeScript ESLint with React hooks plugin

### Development Notes
- Uses Lovable platform for deployment and collaborative development
- Component tagging enabled in development mode for Lovable integration
- ESLint configured to allow unused variables
- Server runs on `::` (all interfaces) port 8080 for accessibility