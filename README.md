# The Alien Project

A comprehensive dashboard to help prepare and track your EB-1A (Extraordinary Ability) visa application.

**Live Demo**: [alien-lake.vercel.app](https://alien-lake.vercel.app)

## Features

- **10 EB-1A Criteria** - Select and track the criteria you're targeting (need 3+ to qualify)
- **USCIS Policy Guidance** - Official regulatory language, evidence examples, and key guidance for each criterion with links to the USCIS Policy Manual
- **Task Management** - Create manual or sync-able tasks for each criterion
- **Evidence Documentation** - Markdown editor for documenting evidence per criterion
- **Sync Integration** - Infrastructure for syncing data from GitHub, Google Scholar, LinkedIn, etc.
- **AI Grader** - Get AI-powered feedback on your evidence strength (simulated, connect your own API)
- **Progress Tracking** - Visual progress bars and completion stats
- **Authentication** - Supabase Auth with email/password
- **Cloud Storage** - All data stored in Supabase PostgreSQL

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL + Auth)
- **Hosting**: Vercel
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repo
git clone https://github.com/omairqazi29/Alien.git
cd Alien

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Setting up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Run migrations from `supabase/migrations/` in order
4. Add your project URL and anon key to `.env`
5. Configure Auth redirect URLs in Supabase Dashboard:
   - Site URL: `https://your-domain.vercel.app`
   - Redirect URLs: `https://your-domain.vercel.app/**`

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
