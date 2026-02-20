# Business Diagnostics | Admin Panel

The administration dashboard for managing assessments, leads, and configuration for the Malta Grants Eligibility assessment tool.

## Features

- Lead management and tracking
- Assessment results visualization
- Dynamic configuration management
- Secure administration access (via Supabase Auth)

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables (see `.env.example`)

### Development

Start the development server:

```bash
npm run dev
```

### Build

Generate a production-ready build:

```bash
npm run build
```

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Shadcn UI
- **Backend**: Supabase (Database & Auth)
- **State Management**: React Query
