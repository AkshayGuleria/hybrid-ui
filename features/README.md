# Features

This directory contains feature specifications and tracks project progress for the hybrid-ui project.

**Managed by:** [tapsa](/tapsa) - the project management agent

## Quick Status

| Feature | Status | Priority | Assignee | Progress |
|---------|--------|----------|----------|----------|
| [routing](./routing/) | **review** | high | niko, yap, billman | 100% |
| [api-layer](./api-layer/) | planned | high | yap, billman | 0% |

## How It Works

1. **Feature specs live here** - Each feature gets its own directory with a README.md
2. **Tapsa manages status** - Use `/tapsa` commands to create, update, and track features
3. **Agents implement** - niko, yap, billman, habibi read specs and build features
4. **Progress is tracked** - Subtask checkboxes update overall status

## Commands

```bash
# Create a new feature
/tapsa create [feature-name] - [description]

# Check overall status
/tapsa status

# Update a feature's status
/tapsa update [feature-id] [status]

# View feature details
/tapsa show [feature-id]

# Generate progress report
/tapsa report
```

## Status Definitions

| Status | Meaning |
|--------|---------|
| `planned` | Spec written, not yet started |
| `in-progress` | Active development |
| `blocked` | Waiting on dependency |
| `review` | Implementation complete, awaiting verification |
| `done` | Fully complete |

## Directory Structure

```
features/
├── README.md           # This file - overview and status
├── _template.md        # Template for new features
├── routing/            # Client-side routing feature
│   └── README.md
├── api-layer/          # Shared API abstraction layer
│   └── README.md
└── [future-features]/
    └── README.md
```

## Creating a New Feature

1. Run `/tapsa create [name] - [description]`
2. Tapsa creates the directory and spec from template
3. Fill in problem statement, acceptance criteria, subtasks
4. Assign to appropriate agent(s)
5. Track progress as work happens

## Agent Assignments

| Agent | Domain | Example Features |
|-------|--------|------------------|
| **niko** | Frontdoor | Auth UI, navigation, app launcher |
| **yap** | CRM | Customers, contacts, pipeline |
| **billman** | Revenue | Invoices, billing, analytics |
| **habibi** | Infrastructure | Docker, nginx, deployment |
| **tommi** | Brainstorming | Idea validation (pre-spec) |
| **tapsa** | Project Management | This directory |
