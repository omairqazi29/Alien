# The Alien Project - EB-1A Preparation Dashboard

A comprehensive dashboard to help prepare and track your EB-1A (Extraordinary Ability) visa application.

## Features

- **10 EB-1A Criteria** - Select and track the criteria you're targeting (need 3+ to qualify)
- **Task Management** - Create manual or sync-able tasks for each criterion
- **Sync Integration** - Infrastructure for syncing data from GitHub, Google Scholar, LinkedIn, etc.
- **AI Grader** - Get AI-powered feedback on your evidence strength (simulated, connect your own API)
- **Progress Tracking** - Visual progress bars and completion stats
- **Local Storage** - Works offline, data persists in browser

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL) - optional, works with localStorage
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/Alien.git
cd Alien

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Environment Variables (Optional)

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GITHUB_TOKEN=your_github_token  # For GitHub sync
VITE_OPENAI_API_KEY=your_openai_key  # For AI grading
```

### Setting up Supabase (Optional)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Add your project URL and anon key to `.env`

## EB-1A Criteria

The 10 criteria for EB-1A extraordinary ability:

1. **Awards** - National/international prizes for excellence
2. **Membership** - Associations requiring outstanding achievements
3. **Press** - Published material about you in major media
4. **Judging** - Participation as a judge in your field
5. **Original Contributions** - Major significance in your field
6. **Scholarly Articles** - Authorship in professional journals
7. **Exhibitions** - Display of work at artistic showcases
8. **Leading Role** - Critical role in distinguished organizations
9. **High Salary** - Commanding high remuneration
10. **Commercial Success** - Success in performing arts

## Development

```bash
# Run dev server
npm run dev

# Type check
npm run build

# Preview production build
npm run preview
```

## License

MIT
