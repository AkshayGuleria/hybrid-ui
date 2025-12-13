# Hybrid UI - Monorepo Project

A modern monorepo containing two containerized React applications: Frontdoor App (login) and Main App (navigation & features).

## Project Structure

```
hybrid-ui/
├── packages/
│   ├── frontdoor-app/       # Login application (React + Vite)
│   └── main-app/            # Main application (React + Vite + React Router)
├── docker-compose.yml       # Docker orchestration
├── CLAUDE.md               # Project documentation
└── README.md               # This file
```

## Prerequisites

- Node.js 18+ (for local development)
- npm or yarn
- Docker & Docker Compose (for containerized deployment)

## Quick Start

### Option 1: Local Development

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Run Frontdoor App (Login):**
   ```bash
   npm run dev:frontdoor
   ```
   Visit: http://localhost:5173

3. **Run Main App (in a separate terminal):**
   ```bash
   npm run dev:main
   ```
   Visit: http://localhost:5174

4. **Run both apps simultaneously:**
   ```bash
   npm run dev:all
   ```

### Option 2: Docker Deployment

1. **Build and run both apps with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Access the applications:**
   - Frontdoor App: http://localhost:5173
   - Main App: http://localhost:5174

3. **Stop the containers:**
   ```bash
   docker-compose down
   ```

## Application Details

### Frontdoor App (Port 5173)
- **Purpose:** Authentication gateway
- **Tech Stack:** React + Vite (no router)
- **Features:**
  - Simple login form (username & password)
  - Client-side validation
  - Redirects to Main App on successful login

### Main App (Port 5174)
- **Purpose:** Main application with navigation
- **Tech Stack:** React + Vite + React Router
- **Features:**
  - Welcome/landing page
  - Left sidebar navigation (15-20% width)
  - Colorful animated logo
  - Placeholder pages: Home, Dashboard, Analytics, Reports, Settings

## Development Commands

### Root Level
```bash
npm run dev:frontdoor    # Run frontdoor app
npm run dev:main         # Run main app
npm run dev:all          # Run both apps
npm run build:frontdoor  # Build frontdoor app
npm run build:main       # Build main app
npm run build:all        # Build both apps
```

### Individual Apps
```bash
cd packages/frontdoor-app
npm install
npm run dev
npm run build

cd packages/main-app
npm install
npm run dev
npm run build
```

## Login Instructions

1. Open Frontdoor App at http://localhost:5173
2. Enter any username and password (client-side validation only)
3. Click "Login"
4. You'll be redirected to Main App at http://localhost:5174
5. Explore the navigation and placeholder pages

## Docker Instructions

### Build Individual Images
```bash
# Build frontdoor-app
docker build -t frontdoor-app ./packages/frontdoor-app

# Build main-app
docker build -t main-app ./packages/main-app
```

### Run Individual Containers
```bash
# Run frontdoor-app
docker run -p 5173:80 frontdoor-app

# Run main-app
docker run -p 5174:80 main-app
```

## Future Enhancements

- [ ] Backend authentication API
- [ ] JWT token handling between apps
- [ ] State management (Redux/Zustand)
- [ ] Shared component library
- [ ] Testing framework (Jest/Vitest + React Testing Library)
- [ ] CI/CD pipeline
- [ ] Reverse proxy/API gateway
- [ ] Environment-specific configurations

## Notes

- Authentication is currently client-side only (no backend)
- Both apps are independent and can be deployed separately
- Navigation links in Main App are placeholders
- The project uses npm workspaces for monorepo management

## License

Private project

## Author

Akshay Guleria
