# MemoApp

A personal knowledge management and learning application that helps users capture, organize, and actively recall information through spaced repetition. The app combines note-taking functionality with intelligent reminder systems and quiz modes to enhance long-term retention of important information.

## Features

- 📝 **Memo Management**: Create, edit, and organize memos with rich categorization
- 🧠 **Spaced Repetition**: Intelligent reminder system based on proven learning algorithms
- 🎯 **Interactive Quizzes**: Test your knowledge and track learning progress
- 🔄 **Offline-First**: Work seamlessly offline with automatic synchronization
- 📱 **Progressive Web App**: Install on any device with native app experience
- 🎨 **Customizable Interface**: Dark/light themes and accessibility features
- 📊 **Progress Tracking**: Detailed analytics and learning insights

## Architecture

This is a monorepo containing:

- **`apps/frontend`**: React PWA with TypeScript, Tailwind CSS, and offline capabilities
- **`apps/backend`**: Express.js API server with PostgreSQL and Redis
- **`packages/shared`**: Shared TypeScript types, validation schemas, and utilities

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development and builds
- Tailwind CSS with custom design system
- React Hook Form + Zod for form validation
- React Query for server state management
- Workbox for PWA and offline functionality

### Backend
- Node.js with Express.js and TypeScript
- Prisma ORM with PostgreSQL
- JWT authentication
- Bull Queue for background jobs
- Web Push API for notifications

### Shared
- TypeScript interfaces and types
- Zod validation schemas
- Utility functions and constants

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+
- Redis 6+ (for background jobs and caching)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/memo-app.git
cd memo-app
```

2. Install dependencies for all workspaces:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
# Copy example environment files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

4. Set up the database:
```bash
# Navigate to backend and run migrations
cd apps/backend
npx prisma migrate dev
npx prisma db seed
```

### Development

Start both frontend and backend in development mode:
```bash
npm run dev
```

Or start them individually:
```bash
# Frontend only (http://localhost:5173)
npm run dev:frontend

# Backend only (http://localhost:3000)
npm run dev:backend
```

### Building for Production

Build all applications:
```bash
npm run build
```

Or build individually:
```bash
npm run build:frontend
npm run build:backend
```

### Testing

Run tests across all workspaces:
```bash
npm run test
```

### Linting

Run linting across all workspaces:
```bash
npm run lint
```

## Project Structure

```
memo-app/
├── apps/
│   ├── frontend/          # React PWA application
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── backend/           # Express.js API server
│       ├── src/
│       ├── prisma/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/            # Shared types and utilities
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── .kiro/
│   └── specs/             # Feature specifications
│       └── memo-app/
├── package.json           # Root package.json with workspaces
├── .gitignore
└── README.md
```

## Development Workflow

1. **Feature Development**: Follow the spec-driven development process in `.kiro/specs/memo-app/`
2. **Code Quality**: Use TypeScript, ESLint, and Prettier for consistent code
3. **Testing**: Write unit, integration, and E2E tests for all features
4. **Git Workflow**: Use conventional commits and feature branches

## API Documentation

Once the backend is running, API documentation is available at:
- Development: http://localhost:3000/api/docs
- Swagger/OpenAPI specification included

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit using conventional commits: `git commit -m 'feat: add amazing feature'`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions and support:
- Create an issue on GitHub
- Check the documentation in the `docs/` folder
- Review the feature specifications in `.kiro/specs/memo-app/`

---

Built with ❤️ for effective learning and knowledge management.