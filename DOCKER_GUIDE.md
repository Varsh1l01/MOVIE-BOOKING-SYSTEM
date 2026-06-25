# CineMaa - Docker Guide

This project is now fully automated with Docker. You can start the entire stack (Frontend, Backend, Database, and Redis) with a single command.

## Prerequisites
* **Docker Desktop** installed and running on your Windows machine.

## How to Start the System

1.  **Open a Terminal** in the project root directory.
2.  **Run the following command**:
    ```bash
    docker-compose up --build
    ```

## What Happens Automatically?
* **Database Readiness**: The backend will wait for the PostgreSQL database to be healthy before starting.
* **Prisma Migrations**: The backend will automatically run migrations (`npx prisma migrate dev`) to set up your database tables the first time it starts.
* **Hot Reloading**: Both frontend and backend are configured for development with hot reloading enabled.

## Accessing the Apps
* **Frontend**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
* **PostgreSQL**: `localhost:5432` (User: `postgres`, Password: `password`)
* **Redis**: `localhost:6379`

## Troubleshooting
* **Database Reset**: If you need to clear all data and start fresh, run:
  ```bash
  docker-compose down -v
  ```
* **View Logs**: To see what's happening inside a container:
  ```bash
  docker-compose logs -f backend
  ```
