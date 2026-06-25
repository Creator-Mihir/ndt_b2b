# CONEX.in - B2B Cable & NDT Online Shop

CONEX.in is a B2B e-commerce platform specifically designed for the cable and Non-Destructive Testing (NDT) industry. The platform allows technical buyers to browse products, request bulk quotes, make digital purchases, and download automated GST invoices.

## Monorepo Layout

- `frontend/`: Next.js App Router, styled with Tailwind CSS.
- `backend/`: Node.js Express API using TypeScript and Mongoose (MongoDB Atlas).

## Getting Started

### Backend Setup

1. Change directory to `backend`:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the template `.env.example` to `.env` and fill in the secrets:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Change directory to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
