---
id: containerization
title: Dockerize Hybrid-UI Multi-App System
status: planned
priority: high
assignee: habibi
created: 2026-01-11
updated: 2026-01-11
dependencies: []
blocks: []
type: infrastructure
---

# Dockerize Hybrid-UI Multi-App System

## Problem Statement

Currently, the hybrid-ui system requires manual setup:
- Developers must install Node.js 18+, npm, and Redis locally
- Environment inconsistencies between dev machines
- No standardized deployment process for production
- Difficult to replicate production environment locally
- Azure AD secrets managed manually in .env files
- No containerized deployment options (AWS ECS, Kubernetes, etc.)

**Current manual setup:**
```bash
# Install Redis (varies by OS)
brew install redis  # macOS
apt-get install redis  # Ubuntu
docker run redis  # Docker

# Install dependencies
npm install

# Start all services manually
npm run dev:all  # 4 processes in one terminal
```

This creates friction for:
- New developers onboarding
- Production deployments
- Testing in isolated environments
- Scaling services independently

## Current State

**Applications:**
- `auth-server` (Express + Redis) - Port 5176
- `frontdoor-app` (React/Vite) - Port 5173
- `crm-app` (React/Vite) - Port 5174
- `revenue-app` (React/Vite) - Port 5175
- Redis database - Port 6379

**Architecture Constraints:**
- ✅ Different ports are intentional (cross-origin architecture)
- ✅ localStorage isolation between apps by design
- ✅ Azure AD OAuth secrets must never be in container images
- ✅ Development needs Hot Module Replacement (HMR)
- ✅ Production needs optimized static builds served by Nginx

## Proposed Solution

Implement **Docker Compose with Multi-Stage Builds** (Approach 5 from tommi's analysis):

### Architecture Overview

```
docker-compose.yml           # Base configuration (shared)
docker-compose.dev.yml       # Development overrides (HMR, volume mounts)
docker-compose.prod.yml      # Production overrides (Nginx, optimizations)
```

**Services:**
1. **redis** - Official Redis 7 Alpine image
2. **auth-server** - Node.js 18 with multi-stage build (dev/prod targets)
3. **frontdoor-app** - Vite dev server (dev) / Nginx static (prod)
4. **crm-app** - Vite dev server (dev) / Nginx static (prod)
5. **revenue-app** - Vite dev server (dev) / Nginx static (prod)

### Key Decisions

**Development Mode:**
- Volume mounts for source code (enables HMR)
- Vite dev server runs inside containers
- `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up`

**Production Mode:**
- Multi-stage builds: build stage → production stage
- Nginx serves optimized static bundles
- Small image sizes (~50MB per frontend, ~150MB auth-server)
- `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d`

**Preserves Architecture:**
- All services still on different ports (5173, 5174, 5175, 5176)
- Cross-origin localStorage isolation maintained
- URL parameter auth flow unchanged
- No code changes required

## Acceptance Criteria

### Development Environment
- [x] `docker-compose up` starts all services
- [x] Hot Module Replacement (HMR) works for React apps
- [x] Source code changes reflected without rebuild
- [x] Redis data persists between restarts
- [x] Azure AD login works in containerized environment
- [x] Auth server connects to Redis via service name
- [x] Developer can attach debugger to running containers

### Production Environment
- [x] Multi-stage builds create optimized images
- [x] Frontend apps served by Nginx (gzip, caching, security headers)
- [x] Production images are small (<200MB total for frontends)
- [x] Environment variables loaded from .env files
- [x] Azure AD secrets not baked into images
- [x] Health checks for all services
- [x] Services restart automatically on failure
- [x] Redis data persisted in named volume

### General
- [x] `.dockerignore` files prevent unnecessary context
- [x] Clear documentation in README.md
- [x] Docker Compose commands documented
- [x] Troubleshooting guide for common issues
- [x] All existing functionality works (no regressions)

## Rollback Plan

If containerization causes issues:
1. Keep existing `npm run dev:all` workflow
2. Docker is opt-in, not mandatory
3. Developers can continue local development
4. Remove Docker files without affecting codebase
5. No code changes mean easy rollback

## Subtasks

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| **Phase 1: Foundation** | | | | |
| 1 | Create base docker-compose.yml | planned | habibi | Redis + network + volumes |
| 2 | Add Redis service with health check | planned | habibi | Official redis:7-alpine |
| 3 | Create auth-server Dockerfile (multi-stage) | planned | habibi | Dev + prod targets |
| 4 | Add auth-server to docker-compose | planned | habibi | Connect to Redis |
| 5 | Test auth server + Redis communication | planned | habibi | Verify /health endpoint |
| 6 | Verify Azure AD login in container | planned | habibi | OAuth callback URLs |
| **Phase 2: Frontend Apps** | | | | |
| 7 | Create frontdoor-app Dockerfile (multi-stage) | planned | habibi | Vite dev + Nginx prod |
| 8 | Create frontdoor nginx.conf for production | planned | habibi | SPA routing, gzip, headers |
| 9 | Add frontdoor-app to docker-compose | planned | habibi | Dev + prod configs |
| 10 | Create crm-app Dockerfile (similar to frontdoor) | planned | habibi | Reuse pattern |
| 11 | Create revenue-app Dockerfile (similar to frontdoor) | planned | habibi | Reuse pattern |
| 12 | Add CRM and Revenue to docker-compose | planned | habibi | Complete all services |
| **Phase 3: Dev Environment** | | | | |
| 13 | Create docker-compose.dev.yml | planned | habibi | Volume mounts, dev targets |
| 14 | Configure volume mounts for HMR | planned | habibi | Exclude node_modules |
| 15 | Test Hot Module Replacement works | planned | habibi | Edit code, see changes |
| 16 | Verify cross-app navigation works | planned | habibi | localhost URLs |
| 17 | Test session management in containers | planned | habibi | Login, navigate, logout |
| **Phase 4: Prod Environment** | | | | |
| 18 | Create docker-compose.prod.yml | planned | habibi | Production overrides |
| 19 | Optimize production image sizes | planned | habibi | Multi-stage, alpine base |
| 20 | Add health checks to all services | planned | habibi | HTTP endpoint checks |
| 21 | Configure restart policies | planned | habibi | unless-stopped |
| 22 | Test production build end-to-end | planned | habibi | Full user flow |
| **Phase 5: Documentation & Polish** | | | | |
| 23 | Create .dockerignore files | planned | habibi | node_modules, dist, .git |
| 24 | Update README.md with Docker instructions | planned | habibi | Setup, commands, troubleshooting |
| 25 | Create DEPLOYMENT.md guide | planned | habibi | Production deployment steps |
| 26 | Document environment variable strategy | planned | habibi | .env files, secrets |
| 27 | Add troubleshooting section | planned | habibi | Common errors, solutions |
| 28 | Create example .env.docker file | planned | habibi | Template for configuration |

## Technical Notes

### Multi-Stage Dockerfile Pattern

**Frontend Apps (frontdoor, crm, revenue):**
```dockerfile
# Stage 1: Development
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Stage 2: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 3: Production
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Auth Server:**
```dockerfile
# Stage 1: Development
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5176
CMD ["npm", "run", "dev"]

# Stage 2: Production
FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5176
USER node
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5176/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
CMD ["npm", "start"]
```

### Docker Compose Structure

**Base (docker-compose.yml):**
```yaml
version: '3.9'

services:
  redis:
    image: redis:7-alpine
    container_name: hybrid-ui-redis
    ports: ["6379:6379"]
    volumes: [redis-data:/data]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks: [hybrid-ui-network]

  auth-server:
    build:
      context: ./packages/auth-server
      dockerfile: Dockerfile
    container_name: hybrid-ui-auth
    ports: ["5176:5176"]
    env_file: ./packages/auth-server/.env
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy
    networks: [hybrid-ui-network]
    restart: unless-stopped

  frontdoor-app:
    build:
      context: ./packages/frontdoor-app
      dockerfile: Dockerfile
    container_name: hybrid-ui-frontdoor
    ports: ["5173:5173"]
    depends_on: [auth-server]
    networks: [hybrid-ui-network]

  # Similar for crm-app and revenue-app...

networks:
  hybrid-ui-network:
    driver: bridge

volumes:
  redis-data:
```

**Development Override (docker-compose.dev.yml):**
```yaml
version: '3.9'

services:
  auth-server:
    build:
      target: development
    volumes:
      - ./packages/auth-server/src:/app/src:delegated
      - /app/node_modules
    environment:
      - NODE_ENV=development

  frontdoor-app:
    build:
      target: development
    volumes:
      - ./packages/frontdoor-app/src:/app/src:delegated
      - /app/node_modules
    command: npm run dev
```

**Production Override (docker-compose.prod.yml):**
```yaml
version: '3.9'

services:
  auth-server:
    build:
      target: production
    environment:
      - NODE_ENV=production
    restart: always

  frontdoor-app:
    build:
      target: production
    ports: ["5173:80"]  # Nginx serves on port 80 internally
    restart: always
```

### Environment Variable Strategy

**Root `.env` (for docker-compose):**
```bash
COMPOSE_PROJECT_NAME=hybrid-ui
NODE_ENV=development
```

**Service-specific `.env` (packages/auth-server/.env):**
```bash
PORT=5176
REDIS_URL=redis://redis:6379
SESSION_TTL_SECONDS=1800
AZURE_AD_TENANT_ID=${AZURE_AD_TENANT_ID}
AZURE_AD_CLIENT_ID=${AZURE_AD_CLIENT_ID}
AZURE_AD_CLIENT_SECRET=${AZURE_AD_CLIENT_SECRET}
AZURE_AD_REDIRECT_URI=http://localhost:5176/auth/azure/callback
```

**Never in Dockerfile:**
```dockerfile
# ❌ NEVER DO THIS
ENV AZURE_AD_CLIENT_SECRET=abc123

# ✅ Load at runtime via env_file
```

### Nginx Configuration for React Apps

```nginx
# packages/frontdoor-app/nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### .dockerignore Files

```
# packages/*/. dockerignore
node_modules
dist
build
.git
.env
*.log
coverage
.vite
.cache
npm-debug.log*
```

### Volume Mount Performance (macOS/Windows)

Docker Desktop has slow volume sync on non-Linux systems.

**Optimizations:**
- Use `:delegated` flag for better performance
- Exclude `node_modules` from mounts (anonymous volume)
- Consider alternatives: OrbStack, Colima

```yaml
volumes:
  - ./packages/frontdoor-app/src:/app/src:delegated  # Delegated consistency
  - /app/node_modules  # Anonymous volume (not mounted)
```

### Health Checks

```yaml
# Redis
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 5s
  timeout: 3s
  retries: 5

# Auth Server
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5176/health"]
  interval: 10s
  timeout: 3s
  retries: 3
  start_period: 10s
```

### Container Networking

**Service Discovery:**
- Containers communicate by service name (e.g., `redis://redis:6379`)
- External access via port mapping (e.g., `localhost:5176`)
- Frontend apps use `localhost` URLs (ports exposed to host)

**Why localhost URLs still work:**
```yaml
# Ports are exposed to host machine
auth-server:
  ports: ["5176:5176"]  # Host:Container

# Frontend code can still use:
const AUTH_URL = 'http://localhost:5176'
# Because 5176 is exposed to host
```

### Usage Commands

```bash
# Development (with HMR)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# Rebuild specific service
docker-compose build crm-app

# View logs
docker-compose logs -f auth-server

# Stop everything
docker-compose down

# Clean everything (including volumes)
docker-compose down -v

# Shell into container
docker-compose exec auth-server sh
```

## Security Considerations

1. **Azure AD Secrets**
   - Never in Dockerfile or image layers
   - Loaded at runtime via `env_file`
   - For production: use Docker secrets, AWS Secrets Manager, or Azure Key Vault

2. **Container Security**
   - Run as non-root user in production (`USER node`)
   - Use Alpine base images (smaller attack surface)
   - Keep base images updated
   - Scan images for vulnerabilities

3. **Network Isolation**
   - Custom bridge network (not default)
   - Only expose necessary ports
   - Redis not exposed externally in production

4. **Image Security**
   - No secrets in image layers
   - .dockerignore prevents .env from being copied
   - Multi-stage builds exclude dev dependencies

## Performance Optimization

**Image Sizes (target):**
- Frontend apps: ~50MB (Nginx + static files)
- Auth server: ~150MB (Node.js + production deps)
- Redis: ~15MB (official Alpine image)

**Build Time:**
- First build: ~5-10 minutes (downloads base images)
- Subsequent builds: ~1-2 minutes (cache hits)
- Changed service only: ~30 seconds

**Startup Time:**
- Development: ~30 seconds (all services)
- Production: ~10 seconds (optimized)

## CI/CD Considerations (Future)

While not in scope for initial implementation, the Docker setup enables:

1. **GitHub Actions**
   ```yaml
   - name: Build Docker images
     run: docker-compose build

   - name: Push to registry
     run: docker-compose push
   ```

2. **Container Registry**
   - Docker Hub
   - GitHub Container Registry
   - AWS ECR
   - Azure Container Registry

3. **Deployment Targets**
   - AWS ECS
   - Azure Container Instances
   - Google Cloud Run
   - Kubernetes
   - DigitalOcean App Platform

## Monitoring & Logging (Future)

Docker setup enables centralized logging:

```yaml
# Future enhancement
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

Can integrate with:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Grafana + Loki
- AWS CloudWatch
- Azure Monitor

## Progress Log

### 2026-01-11
- Initial spec created by tapsa
- Assigned to habibi (infrastructure agent)
- Based on tommi's Approach 5 recommendation
- 28 subtasks defined across 5 phases
- Priority: high (foundational for production deployment)

## Related

- Depends on: (none - standalone infrastructure feature)
- Blocks: (none - optional enhancement)
- Related brainstorming: tommi's containerization analysis (5 approaches evaluated)
- Related agents: habibi (implementation), all agents (testing in containerized env)

---

## Quick Reference

**Start development:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

**Start production:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**View logs:**
```bash
docker-compose logs -f
```

**Stop all:**
```bash
docker-compose down
```
