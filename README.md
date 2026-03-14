# Online-E-book-Store (Stripe Payment Project)

## Description

A comprehensive full-stack e-commerce solution designed for selling digital PDF products. This project integrates secure payment processing with Stripe, automated email delivery via SendGrid, and features a robust admin dashboard for managing products and orders.

## Tech Stack

### Frontend

- **Framework**: [Next.js](https://nextjs.org/) (v13.4)
- **Library**: React (v18.2)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Rich Text Editor**: React Quill
- **Payment UI**: @stripe/react-stripe-js

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL 8.0 (using `mysql2` driver)
- **Authentication**: JWT & BCrypt
- **Email**: @sendgrid/mail
- **Payment Processing**: Stripe API
- **File Uploads**: Multer

### Infrastructure

- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Database Management**: PhpMyAdmin

## Features

- **Secure Authentication**: User registration and login protected by JWT and BCrypt.
- **Digital Product Store**: Browse and purchase PDF products.
- **Stripe Integration**: Seamless and secure checkout process.
- **Automated Delivery**: Instant email delivery of purchased PDFs via SendGrid.
- **Admin Dashboard**:
  - Manage products (Create, Read, Update, Delete).
  - View sales analytics and charts.
  - User management.
- **Responsive Design**: Optimized for both desktop and mobile devices.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Docker](https://www.docker.com/products/docker-desktop) & Docker Compose
- [Node.js](https://nodejs.org/) (Optional, for local non-Docker runs)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd stripe-payment
```

### 2. Environment Configuration

Create a `.env` file in the root directory based on the example provided.

```bash
cp .env.example .env
```

Open the `.env` file and populate the following variables:

```env
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_sender_email

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# Domain & API Configuration
DOMAIN=http://localhost:5001
API_URL=http://localhost:4000
```

### 3. Running with Docker (Recommended)

Use Docker Compose to spin up the entire stack (Database, Backend, Frontend, PhpMyAdmin).

**For Development:**

```bash
docker-compose -f docker-compose.dev.yml up --build
```

**For Production:**

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

### 4. Access the Application

Once the containers are running, you can access the services at:

- **Frontend Store**: [http://localhost:5001](http://localhost:5001)
- **Backend API**: [http://localhost:4000](http://localhost:4000)
- **PhpMyAdmin**: [http://localhost:8080](http://localhost:8080) (Log in with `root` / `rootpassword` as defined in compose file)

## Project Structure

```
.
├── backend/                # Express.js backend source code
│   ├── routes/             # API routes
│   ├── server.js           # Entry point
│   └── init.sql            # Database initialization script
├── frontend/               # Next.js frontend source code
│   ├── app/                # App router pages
│   ├── components/         # Reusable UI components
│   └── public/             # Static assets
├── docker-compose.dev.yml  # Docker services for development
├── docker-compose.prod.yml # Docker services for production
└── .env                    # Environment variables
```

## Scripts

### Root

- `npm start`: Runs `node index.js`
- `npm run dev`: Runs `nodemon index.js`

### Backend

- `npm run dev`: Runs the server with nodemon for hot reloading.

### Frontend

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Builds the application for production.
- `npm start`: Starts the production server.
