# Action Track - Project Management System

## Overview

Action Track is a full-stack project management application built for construction/engineering teams to track actions and tasks across different disciplines (precon, production, design, commercial, misc). The application features a React frontend with shadcn/ui components, an Express.js backend, and uses Drizzle ORM with PostgreSQL for data persistence.

**Current Status**: Fully optimized dataset with 78 unique actions across 6 projects, realistic completion timing patterns, and proper overdue management (maximum 15 days overdue for any item).

## User Preferences

Preferred communication style: Simple, everyday language.
Preferred interface style: Extremely clean, minimal interface with no titles or subtitles in action lists, custom modals preferred over browser dialogs, slim design elements.
Mobile optimization requirements: Abbreviated phases (Ten/Pre/Con/Aft) and disciplines (Ops/Comm/Des/SHE/QA) in action cards, first name only for assignees on small screens.
Navigation preferences: Minimal navbar with Drill logo, Home instead of Dashboard, '+ Action' button in navbar, settings cog icon, no profile pictures or notification bells.
Color scheme: Accent color changed to #cc3333 (hsl(350, 61%, 50%)) instead of blue.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **Routing**: Wouter (lightweight client-side routing)
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Request Processing**: Express middleware for JSON parsing and logging
- **Error Handling**: Centralized error handling middleware

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with connection pooling
- **Schema Management**: Code-first approach with TypeScript definitions
- **Migrations**: Drizzle Kit for schema migrations

## Key Components

### Data Models
- **Users**: Authentication and user management (id, username, password, name, email)
- **Projects**: Project organization (id, name, description, status, timestamps)
- **Actions**: Core task management (id, title, description, discipline, phase, status, priority, assignee, project, due date, timestamps)
  - **Disciplines**: Operations, Commercial, Design, SHE, QA
  - **Phases**: Tender, Precon, Construction, Aftercare
  - **Status**: Open, Closed, Overdue

### Frontend Components
- **Navigation**: Responsive navbar and mobile bottom navigation
- **Action Management**: Action cards, forms, and filtering
- **Dashboard**: Statistics cards and recent actions overview
- **UI Components**: Complete shadcn/ui component library

### Backend Services
- **Storage Layer**: Abstracted database operations through IStorage interface
- **Route Handlers**: CRUD operations for actions, projects, and users
- **Database Connection**: Neon serverless PostgreSQL with connection pooling

## Data Flow

1. **Client Requests**: React components make API calls using TanStack Query
2. **API Layer**: Express routes handle HTTP requests and validation
3. **Business Logic**: Storage layer processes business operations
4. **Data Access**: Drizzle ORM executes SQL queries against PostgreSQL
5. **Response**: JSON data flows back through the layers to update UI

### Query and Mutation Flow
- TanStack Query manages caching, background updates, and optimistic updates
- Form submissions use React Hook Form with Zod validation
- Real-time UI updates through query invalidation and refetching

## External Dependencies

### Frontend Dependencies
- **UI Framework**: Radix UI primitives for accessibility
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for date formatting and manipulation
- **Form Validation**: Zod schemas shared between client and server
- **Styling**: class-variance-authority for component variants

### Backend Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connectivity
- **ORM**: drizzle-orm and drizzle-zod for type-safe database operations
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **WebSocket**: ws library for Neon's WebSocket connections

### Development Tools
- **Build**: esbuild for server bundling, Vite for client bundling
- **Type Checking**: TypeScript with strict mode enabled
- **Development**: tsx for running TypeScript directly
- **Database**: drizzle-kit for migrations and schema management

## Deployment Strategy

### Build Process
- **Client**: Vite builds static assets to `dist/public`
- **Server**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **Database**: Requires `DATABASE_URL` environment variable
- **Development**: NODE_ENV=development for development mode
- **Production**: NODE_ENV=production for optimized builds

### Development Workflow
- Hot module replacement for client-side changes
- Server restart via tsx watch mode for backend changes
- Shared TypeScript types between client and server via `@shared` alias

### Production Considerations
- Static file serving through Express in production
- Database connection pooling for scalability
- Error handling and logging for monitoring
- Environment-specific configurations