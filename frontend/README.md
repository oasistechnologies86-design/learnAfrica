# LearnAfrica — Frontend

React + Vite application. The website that students, instructors, and admins see.

## File Structure

```
frontend/
├── src/
│   ├── main.jsx                    ← App entry point
│   ├── App.jsx                     ← Routes
│   ├── index.css                   ← Global styles
│   ├── context/
│   │   ├── AuthContext.jsx         ← Login state, JWT, WebSocket
│   │   └── ThemeContext.jsx        ← Dark/light mode
│   ├── layouts/                    ← Page wrapper components
│   ├── components/                 ← Reusable UI components
│   └── pages/                      ← One folder per page
│       ├── Auth/                   ← Login, Signup, Onboarding
│       ├── Courses/                ← Course list, Course detail
│       ├── Dashboard/              ← Student dashboard
│       ├── Instructor/             ← Instructor pages
│       ├── Admin/                  ← Admin panel
│       ├── Lessons/                ← Lesson viewer
│       ├── Quiz/                   ← Quiz pages
│       └── Landing/                ← Homepage
├── index.html
├── package.json
├── vite.config.js                  ← Build config + dev proxy
├── vercel.json                     ← Vercel SPA routing
└── .env.example                    ← Environment variable template
```

## Local Development

**Step 1 — Install Node.js dependencies**
```bash
cd frontend
npm install
```

**Step 2 — Create your .env.local file**
```bash
cp .env.example .env.local
```
For local development, set:
```
VITE_API_URL=
```
Leave `VITE_API_URL` empty — Vite will proxy API calls to `localhost:5000` automatically.

**Step 3 — Start the dev server**
```bash
npm run dev
```
The app is now running at `http://localhost:5173`

Make sure the backend is also running (`python run.py`) before using the app.

## Build for Production

```bash
npm run build
```
This creates a `dist/` folder with the compiled app. Vercel runs this automatically.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| VITE_API_URL | Production only | Your Render backend URL |
| VITE_SITE_URL | Recommended | Public frontend URL used for generated site links and metadata |
| VITE_GOOGLE_CLIENT_ID | Optional | Public Google OAuth client ID for the frontend sign-in button |

Supabase is accessed by the backend. Do not add Supabase service credentials or database keys to the frontend.

