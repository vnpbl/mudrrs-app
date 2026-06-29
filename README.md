# MUDRRS — Mapúa University Digital Room Reservation System

A web-based room reservation system for Mapúa University students and library staff, supporting the **Makati** and **Intramuros** campuses. Built with React, TypeScript, Supabase, and Tailwind CSS.

## Features

### For Students
- **Room Booking** — Browse available rooms and reserve a time slot for study sessions
- **Reservation Management** — View, track, and manage all your reservations in one place
- **Real-time Updates** — Reservation status changes (approval, rejection, check-in) appear instantly
- **Calendar View** — Visual calendar showing your bookings across each month
- **Status Filters** — Filter reservations by Active, Pending, or Upcoming status

### For Library Staff
- **Board View** — See all reservations grouped by status (Pending, Active, Completed) with date filtering and search
- **Reservation Workflow** — Approve, reject, check-in, check-out, and cancel reservations
- **Room Configuration** — Add, edit, or deactivate rooms per campus
- **Analytics Dashboard** — View usage statistics with Excel export capability
- **Real-time Sync** — All changes propagate instantly to connected staff dashboards

### General
- **Email Notifications** — Students receive email confirmations on approval and rejection via EmailJS
- **Session Timeout** — Automatic logout after 30 minutes of inactivity for security
- **Role-based Access** — Separate routes and views for students vs. library staff
- **Responsive Design** — Works on desktop and mobile devices

## Tech Stack

| Layer        | Technology                                                              |
| ------------ | ----------------------------------------------------------------------- |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS 3                            |
| **Backend**  | Supabase (PostgreSQL, Auth, Realtime subscriptions)                     |
| **Routing**  | React Router DOM v7                                                     |
| **Email**    | EmailJS (confirmation & rejection templates)                            |
| **Export**   | SheetJS (xlsx) for analytics data export                                |
| **Linting**  | ESLint 10 with TypeScript-ESLint, React Hooks & React Refresh plugins   |

## Getting Started

### Prerequisites

- Node.js >= 18
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/vnpbl/mudrrs-app.git
cd mudrrs-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=your-service-id
VITE_EMAILJS_PUBLIC_KEY=your-public-key
VITE_EMAILJS_TEMPLATE_CONFIRMATION=your-confirmation-template-id
VITE_EMAILJS_TEMPLATE_REJECTION=your-rejection-template-id
```

## Project Structure

```
mudrrs-app/
├── public/                  # Static assets (favicon, icons)
├── src/
│   ├── assets/              # Images and other static resources
│   ├── contexts/            # React context providers (AuthContext)
│   ├── pages/               # Route page components
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── StaffSignupPage.tsx
│   │   ├── Homepage.tsx         # Student dashboard
│   │   ├── BookingPage.tsx      # Room booking flow
│   │   ├── ReservationsPage.tsx # Student reservation list
│   │   └── StaffDashboard.tsx   # Staff management panel
│   ├── services/            # Third-party integrations (EmailJS)
│   ├── supabase/            # Supabase client, auth, and data services
│   │   ├── client.ts
│   │   ├── authService.ts
│   │   ├── roomService.ts
│   │   ├── reservationService.ts
│   │   ├── studentService.ts
│   │   ├── realtimeService.ts
│   │   └── types.ts
│   ├── App.tsx              # Root component with routing
│   ├── main.tsx             # Application entry point
│   ├── types.ts             # Shared TypeScript interfaces
│   └── index.css            # Global styles (Tailwind directives)
├── supabase/                # Supabase local config & edge functions
│   ├── config.toml
│   └── functions/
├── .env                     # Environment variables (not committed)
├── index.html               # Vite HTML entry
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── tsconfig.app.json        # TypeScript config (app)
├── tsconfig.node.json       # TypeScript config (Node)
├── eslint.config.js         # ESLint flat config
├── postcss.config.js        # PostCSS configuration
└── package.json
```

## Available Scripts

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start the Vite development server        |
| `npm run build`     | Type-check and build for production      |
| `npm run preview`   | Preview the production build locally     |
| `npm run lint`      | Run ESLint across the codebase           |

## Authentication & User Roles

### Student
- Signs up via the **Sign Up** page with student ID, name, and email
- Can book rooms, view reservations, and receive email notifications
- Redirected to `/dashboard` after login

### Library Staff
- Signs up via the **Staff Sign Up** page with staff ID, name, and assigned campus
- Has access to the staff dashboard at `/dashboard-staff`
- Can manage rooms, process reservations, and view analytics

### Session Management
- Sessions persist via Supabase Auth
- Automatic logout after **30 minutes of inactivity**
- Activity is tracked via mouse, keyboard, scroll, and touch events

## Reservation Lifecycle

```
Pending → Approved → Active (check-in) → Completed (check-out)
       → Rejected
       → Cancelled
       → Auto-Cancelled (no-show after 15-minute grace period)
```

## License

This project is for educational and internal use by Mapúa University.