# 🌿 GreenMile

> **Turn Every Commute into a Carbon Reward**

GreenMile is a carbon-tracking and rewards platform designed for daily commuters. Built as a prototype for the **OneJourney Mobility Hackathon**, it helps users compare travel modes, calculate CO₂ emissions, track savings, and earn rewards for choosing greener transportation.

## ✨ Features

- **🔄 Mode Comparison**: Compare car, bus, metro, cycle, and walking modes for any trip (Cost, Time, and CO₂).
- **🌱 Carbon Tracking**: Calculate exact CO₂ savings and visualize your impact.
- **🏆 Rewards Wallet**: Earn "Green Points" for eco-friendly trips and redeem them for real-world discounts.
- **👥 Community Dashboard**: Track the collective impact of your community or organization, complete with a leaderboard.
- **💡 Smart Nudges**: Get AI-inspired recommendations on how to commute greener.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite (`better-sqlite3`)
- **Deployment Ready**: Fully configured for Vercel deployment.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd hackathon
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open the app**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

*Note: The SQLite database (`greenmile.db`) will be automatically created and seeded with demo data on the first API request.*

## 🎬 Demo User

The database is pre-seeded with a demo user to showcase the dashboard and rewards functionality:
- **Name**: Prasanna
- **Email**: demo@greenmile.app

## 📁 Project Structure

- `/src/app`: Next.js frontend pages and API routes.
- `/src/components`: Reusable UI components (Header, Footer).
- `/src/lib`: Database configuration (`db.ts`) and core business logic (`calculations.ts`).

## 💚 Built With

Built with 💚 for a greener tomorrow, as part of the OneJourney Mobility Hackathon.
