# 🏋️ IntelliFit - Smart Gym Management System

> **Complete gym ecosystem with AI coaching, equipment booking, InBody tracking, and personalized nutrition plans**

![Demo App](/public/screenshot-for-readme.png)

## ✨ What's New

This is a **fully integrated smart gym management platform** combining AI-powered fitness coaching with complete gym operations:

### 🎯 Key Features

- 🤖 **AI-Powered Coaching** - Voice program generation + text chat (Gemini & Vapi)
- 🪙 **Token Economy** - Unified payment system for all services
- 📅 **Equipment Booking** - Real-time availability and reservations
- 👨‍🏫 **Coach Sessions** - Professional trainer booking system
- 📊 **InBody Tracking** - Body composition measurements with trend analysis
- ✅ **Coach Approval** - Quality control for AI-generated plans
- 📈 **Member Dashboard** - Complete overview hub with stats and quick actions

### 🚀 Tech Stack

- **Framework:** Next.js 15.2.4 (App Router) + React 19
- **Language:** TypeScript 5.x
- **Styling:** TailwindCSS 4.x + shadcn/ui
- **Authentication:** Clerk (GitHub, Google, Email/Password)
- **Database:** Convex (Real-time)
- **AI:** Google Gemini + Vapi Voice AI
- **Icons:** Lucide React

### 📁 Pages Included

| Page          | Route               | Purpose                               | Token Cost  |
| ------------- | ------------------- | ------------------------------------- | ----------- |
| **Dashboard** | `/dashboard`        | Member hub with stats & quick actions | Free        |
| **Bookings**  | `/bookings`         | Equipment & coach reservations        | 5-35 tokens |
| **InBody**    | `/inbody`           | Body composition tracking             | Free        |
| **Tokens**    | `/tokens`           | Token management & purchases          | -           |
| **AI Coach**  | `/ai-coach`         | Text chat with AI                     | 1 token/msg |
| **Profile**   | `/profile`          | User programs & settings              | Free        |
| **Generate**  | `/generate-program` | Voice AI program creation             | 50 tokens   |

### 🗄️ Database Schema

9 tables with comprehensive gym management:

- `users` (enhanced with gym fields: role, tokenBalance, subscriptionPlan)
- `plans` (enhanced with approval workflow: generatedBy, approvalStatus, assignedCoachId)
- `bookings` (NEW - equipment/coach reservations)
- `equipment` (NEW - gym equipment catalog)
- `inBodyMeasurements` (NEW - body composition data)
- `aiQueryLogs` (NEW - chat history)
- `tokenTransactions` (NEW - token operations)

### 📊 Mock Data

All pages use static data for demonstration:

- **Token Balance:** 250 tokens
- **Equipment:** 6 items (Bench Press, Treadmill, Squat Rack, etc.)
- **Coaches:** 3 trainers with ratings and specializations
- **Bookings:** 3 upcoming, 3 past
- **InBody:** 5 weekly measurements showing progress
- **Transactions:** 7 token history entries

## Setup .env file

```js
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Clerk Redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Vapi Voice AI
NEXT_PUBLIC_VAPI_WORKFLOW_ID=
NEXT_PUBLIC_VAPI_API_KEY=

# Convex Database
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
```

## Getting Started

1. Clone the repository
2. Install dependencies:

```shell
npm install
```

3. Set up your environment variables as shown above
4. Run the development server:

```shell
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This application can be easily deployed to Vercel:

```shell
npm run build
npm run start
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Technologies Used

- **Next.js**: React framework for building the frontend and API routes
- **Tailwind CSS & Shadcn UI**: For styling and UI components
- **Clerk**: Authentication and user management
- **Vapi**: Voice agent platform for conversational AI
- **Convex**: Real-time database
- **Gemini AI**: Large Language Model for generating personalized fitness programs

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Vapi Documentation](https://docs.vapi.ai)
- [Convex Documentation](https://docs.convex.dev)
- [Gemini AI Documentation](https://ai.google.dev/gemini-api)
