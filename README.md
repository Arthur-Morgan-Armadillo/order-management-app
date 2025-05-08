# Order Management App

## Table of Contents

* [Overview](#Overview)
* [Architecture](#architecture)
* [Features](#features)
* [Tech Stack](#tech-stack)
* [Prerequisites](#prerequisites)
* [Installation & Setup](#installation--setup)
* [Environment Variables](#environment-variables)
* [Running the Application](#running-the-application)
* [Docker Usage](#docker-usage)
* [Running Tests](#running-tests)
* [API Endpoints](#api-endpoints)
* [Limitations](#limitations)
* [Contributing](#contributing)
* [License](#license)

## Overview

The Order Management App is a monolithic application designed to handle orders, products, and users. It features a backend built with NestJS and a frontend developed with Next.js. The application supports creating orders, viewing orders by user, and listing available products and users. It is containerized using Docker for ease of deployment.

## Architecture

```
order-management-app
├── apps
│   ├── backend        # NestJS API with Prisma
│   └── frontend       # Next.js app
├── docker-compose.yml # Compose setup for backend, frontend & database
├── entrypoint.sh      # DB migrations & seeding for backend container
└── package.json       # Root script orchestration
```

## Features

* User catalog (list users)
* Product catalog (list products)
* Order creation & retrieval
* Data validation with DTO (Class-Validator)
* Rate limiting via NestJS Throttler
* Global exception handling

## Tech Stack

### Backend
-   **Framework**: NestJS
-   **Database**: PostgreSQL
-   **ORM**: Prisma
-   **Rate Limiting**: NestJS Throttler
-   **DTO Validation**: Class-Validator

### Frontend
-   **Framework**: Next.js
-   **UI Components**: Shadcn UI
-   **Form Handling**: React Hook Form
-   **Schema Validation**: Zod
-   **Logging**: Pino

### Testing
-   **Framework**: Jest (unit & e2e Backend only)

### Deployment
-   **Containerization**: Docker (Backend, Frontend, Database)
-   **Orchestration**: Docker Compose
-   **Backend Entrypoint Script**: Shell script for migrations, seeding, and app start.

## Prerequisites

* Node.js v20+
* npm v8+
* Docker & Docker Compose (optional, recommended)
* PostgreSQL (if running without Docker)

## Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/Arthur-Morgan-Armadillo/order-management-app.git
   cd order-management-app
   ```
2. **Install dependencies**

   ```bash
   npm install
   ```

## Environment Variables

Each sub-app has its own `.env` template under `test_environment_*`. Copy and rename:

* **Backend**: `apps/backend/test_environment_backend/.test.env` → `apps/backend/.env`
* **Frontend**: `apps/frontend/test_environment_frontend/.test.env` →

  * rename to `.env.development` or `.env.production` and place next to `apps/frontend/tsconfig.json`
* **Root**: `test_environment_root/.test.env` → `.env.local` next to `docker-compose.yml`

Populate required variables (DB URL, ports, etc.) in these files.

## Running the Application

All commands should be run from the root of the project. If any command is not working, please check the `package.json` file.

### Backend

1.  **Setup Prisma and Database:**
    This command handles database migrations and seeding
    ```bash
    npm run prisma:setup
    ```

2.  **Start the backend server:**
    -   For production mode:
        ```bash
        npm run backend:prod
        ```
    -   For development mode (with auto-reloading):
        ```bash
        npm run backend:start:dev
        ```
    The backend will be accessible, by default, at `http://localhost:5005/api/v1/`.

### Frontend

1.  **Start the frontend server:**
    -   For development mode:
        ```bash
        npm run frontend:dev
        ```
    -   To build for production and then start:
        ```bash
        npm run frontend:prod
        ```
    The frontend will be accessible, by default, at `http://localhost:5000`.

## Docker Usage

1. **Build & start services**

   ```bash
   docker-compose up --build
   ```
2. **Access**

   * Backend API (default): `http://localhost:5005/api/v1`
   * Frontend (default): `http://localhost:5000`

> **Note:** Named Docker volume for PostgreSQL persists data. Use `docker-compose down -v` to clear volumes.

## Running Tests

Both commands should be run from the root of the project.

### Backend Unit Tests

```bash
npm run backend:test
```

### Backend E2E Tests

```bash
npm run backend:test:e2e
```

  * Sequential Execution: Tests are configured to run sequentially. This is due to global setup (global-setup.ts) and teardown (global-teardown.ts) scripts that perform necessary Prisma commands for database preparation and cleanup. Therefore, running individual test files or suites might not work as expected without adjustments.
  * Jest E2E Configuration: There might be an issue with the jest-e2e.json configuration not setting the correct paths. If you encounter errors related to module resolution or finding test files, try adjusting the rootDir or other path-related settings within apps/backend/test/jest-e2e.json.

## API Endpoints

Base URL (default): `http://localhost:5005/api/v1`

### Orders

* **GET** `/orders/:userId`

  * 200: list of orders for user
  * 404: user not found or no orders
* **POST** `/orders`

  * 201: created order
  * 400: invalid input, price mismatch, insufficient balance, out of stock
  * 404: user or product not found

### Products

* **GET** `/products`

  * 200: list of products
  * 404: no products found

### Users

* **GET** `/users`

  * 200: list of users
  * 404: no users found

All successful responses follow:

```ts
interface IServerSuccessResponse<T> {
  status: 'success';
  payload: { data: T };
}
```

Errors follow:

```ts
interface IServerErrorResponse {
  status: 'error';
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}
```

## Limitations

* Frontend Testing: The frontend part of the application is not currently covered by automated tests.
* Frontend Optimization: The frontend implementation may not be fully optimized for performance or best practices. The primary focus during development was on the backend.
* Monolithic Architecture: The application uses a monolithic architecture. While this simplifies some aspects, it is not a monorepo setup, which might be preferred for managing distinct frontend and backend projects more independently in larger scenarios.

## Contributing

Contributions welcome! Please fork, create feature branches, and open pull requests.

## License

UNLICENSED
