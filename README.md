# CRM Backend API

## Live API

### Base URL
https://crm-backend-pswf.onrender.com

This is the backend service for a full stack CRM (Customer Relationship Management) system.  
It provides secure RESTful APIs for managing leads, deals, tickets, companies, activities, and user authentication.

The backend handles business logic, database operations, role-based authorization, and communication with the frontend application.

---

## Features

- User authentication (JWT)
- Role-Based Access Control (RBAC)
- Lead management
- Deal tracking
- Ticket management
- Company records
- Activity tracking
- Dashboard analytics endpoints
- Email service integration
- Secure RESTful API architecture
- Environment-based configuration

---

## Role-Based Access Control

The system implements role-based authorization to control access to resources.

### Admin
- Full system access
- View and manage all CRM data

### User
- Limited access to assigned records
- Create and update own leads and deals

Middleware is used to verify user roles before allowing access to protected routes.

---

## Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- JWT Authentication

### Tools
- Postman (API testing)
- Render (Deployment)
- Neon PostgreSQL (Cloud database)

---

## Project Structure

src/
 ├── controllers/
 ├── routes/
 ├── models/
 ├── middleware/
 ├── config/
 ├── services/
 └── utils/
 
##Getting Started
1. Clone the repository
git clone https://github.com/Mizba-Hub/CRM-BACKEND.git
cd CRM-BACKEND

3. Install dependencies
npm install
Environment Variables

Create a .env file in the root directory.

PORT=5000
DB_NAME=crm_db
DB_USER=postgres
DB_PASS=yourpassword
DB_HOST=localhost
DB_PORT=5432

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password

FRONTEND_URL=http://localhost:3000
NODE_ENV=development

##Database Setup

Install PostgreSQL

Create database

CREATE DATABASE crm_db;

Update credentials in .env

##Running the Server
Development-npm run dev

Production-npm start

##Server runs at:

http://localhost:5000

##Deployment

Backend API deployed on Render
Database hosted on Neon PostgreSQL

##Frontend Repository

https://github.com/Mizba-Hub/CRM-PROJECT

##System Architecture

Frontend → Next.js (Vercel)
Backend → Node.js + Express (Render)
Database → PostgreSQL (Neon)

The frontend communicates with backend REST APIs for all CRM operations.

##API Testing

Test endpoints using:
Postman

##Project Purpose

This backend was developed as part of a full stack CRM system to demonstrate real-world architecture with authentication, role-based authorization, and structured API design.

##Security Notes

• Do not commit .env
• Store secrets securely
• Validate all requests
• Protect role-restricted routes

##Author

Fathimathul Mizba
Full Stack Developer
