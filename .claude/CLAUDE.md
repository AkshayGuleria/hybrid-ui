# Hybrid UI - Monorepo Project

## Project Overview
This is a monorepo containing 2 separate containerized applications:
1. **Frontdoor App** - Login application (pure React SPA, no React Router)
2. **Main App** - Main application with navigation and features (React + React Router)

## Architecture
- Both apps run in separate containers
- User flow: Login on Frontdoor App → Redirect to Main App → Navigate within Main App
- Each app is independently deployable

## Project Structure
```
hybrid-ui/
├── packages/
│   ├── frontdoor-app/       # Login application
│   │   ├── Dockerfile
│   │   └── ...
│   └── main-app/            # Main application with navigation
│       ├── Dockerfile
│       └── ...
├── CLAUDE.md                # This file
└── package.json             # Root package.json for monorepo
```

## Frontdoor App Details

### Technology Stack
- **Framework**: React 18+
- **Build Tool**: Vite
- **Routing**: None (pure React SPA, no React Router)
- **Container**: Docker

### Features
- Simple login screen with username & password
- Client-side authentication (no backend yet)
- Redirects to Main App after successful login

### Port
- Development: 5173 (default Vite port)
- Production: TBD

## Main App Details

### Technology Stack
- **Framework**: React 18+
- **Build Tool**: Vite
- **Routing**: React Router
- **Container**: Docker

### Features
1. **Landing/Welcome Page**
   - Displayed after successful login from Frontdoor App
   - Welcome message for authenticated users

2. **Navigation Layout**
   - Left sidebar navigation bar (15-20% of page width)
   - Colorful branding logo at the top of navigation
   - Persistent navigation across all pages
   - Dummy placeholder links for future features

### Port
- Development: 5174 (Vite)
- Production: TBD

## Development Commands

### Frontdoor App
```bash
cd packages/frontdoor-app
npm install
npm run dev              # Run in development mode
npm run build           # Build for production
docker build -t frontdoor-app .
docker run -p 5173:80 frontdoor-app
```

### Main App
```bash
cd packages/main-app
npm install
npm run dev              # Run in development mode
npm run build           # Build for production
docker build -t main-app .
docker run -p 5174:80 main-app
```

## Future Enhancements
- Implement proper authentication with backend
- Add JWT token handling between apps
- Add state management (Redux/Zustand) in Main App
- Add shared component library
- Add testing framework
- Configure reverse proxy/API gateway
- Add CI/CD pipeline

## Notes
- Authentication is currently client-side only
- Navigation links are placeholders
- Apps communicate via redirect (can be enhanced with tokens/session)
