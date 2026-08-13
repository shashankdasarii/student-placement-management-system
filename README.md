# Student Placement Management System 🎓💼

A modern, full-stack web application built to streamline campus placement drives, automated CGPA eligibility filtering, student job applications, and recruiter candidate management.

---

## 🚀 Resume Highlights

- **Architected a full-stack Student Placement Management System** using React, Node.js, Express, and MySQL to streamline job drives and candidate tracking.
- **Implemented Role-Based Access Control (RBAC)** and secure authentication using JWTs and `bcryptjs` password hashing across Student and Recruiter roles.
- **Engineered server-side SQL algorithms** to dynamically filter job eligibility based on student CGPA and drive deadlines.
- **Integrated secure PDF file uploads** via `multer` and static middleware, allowing recruiters to review candidate resumes directly within the portal.
- **Designed a relational database schema** using MySQL foreign keys, subqueries, and transactions to guarantee data integrity across users, companies, jobs, and applications.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, React Router v6, Axios, Custom Modular CSS (Dark Slate Theme)
- **Backend:** Node.js, Express.js, JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`), File Uploads (`multer`)
- **Database:** MySQL 8 (`mysql2/promise` pool with transactions, FK constraints, and dynamic subqueries)

---

## 🏗️ Architecture & Database Design

### Database ER Diagram

```mermaid
erDiagram
    users ||--o| students : "has profile (user_id)"
    users ||--o| recruiters : "has profile (user_id)"
    recruiters ||--o{ jobs : "posts (company_id)"
    students ||--o{ applications : "submits (student_id)"
    jobs ||--o{ applications : "receives (job_id)"

    users {
        int id PK
        string username UNIQUE
        string password
        enum role "student, recruiter, admin"
        timestamp created_at
    }

    students {
        int id PK
        int user_id FK, UNIQUE
        string name
        string email UNIQUE
        decimal cgpa
        string branch
        string resume_url
        timestamp created_at
    }

    recruiters {
        int id PK
        int user_id FK, UNIQUE
        string company_name
        timestamp created_at
    }

    jobs {
        int id PK
        int company_id FK
        string title
        text description
        decimal min_cgpa
        datetime deadline
        timestamp created_at
    }

    applications {
        int id PK
        int student_id FK
        int job_id FK
        enum status "Applied, Shortlisted, Interviewing, Accepted, Rejected"
        timestamp applied_at
    }
```

---

## ✨ Features

### 🎓 Student Portal
- **Secure Registration & Login:** Password protection via `bcryptjs` and 24-hour JWT token sessions.
- **Automated CGPA Eligibility Engine:** Only view and apply for jobs where your CGPA meets or exceeds the recruiter's minimum threshold (`student.cgpa >= job.min_cgpa`).
- **PDF Resume Uploads:** Upload and host official PDF resumes served statically via Express.
- **Application Tracking:** Track real-time status updates (`Applied`, `Shortlisted`, `Accepted`, `Rejected`).

### 💼 Recruiter Portal
- **Job Posting Management:** Create job listings specifying title, description, minimum CGPA, and drive deadline.
- **Applicant Review Drawer:** View candidate list for each posted job including Name, Email, Branch, CGPA, and direct links to candidate PDF resumes.
- **Status Decision Engine:** Update candidate status in real time (`Shortlisted`, `Accepted`, `Rejected`).

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MySQL Server (running on `localhost:3306`)

### 1. Database Setup
Execute `database/schema.sql` to initialize `placement_db` and tables:
```bash
mysql -u root < database/schema.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Ensure `.env` contains:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=placement_db
JWT_SECRET=super_secret_jwt_key_123
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm start
```

Navigate to `http://localhost:3000` in your web browser.

---

## 📡 API Reference Table

| Module | Method | Endpoint | Access | Description |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Public | Register student or recruiter |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT token |
| **Auth** | `GET` | `/api/auth/me` | Private | Fetch logged-in user profile |
| **Student** | `POST` | `/api/students/upload-resume` | Student | Upload PDF resume |
| **Jobs** | `POST` | `/api/jobs` | Recruiter | Post new job opening |
| **Jobs** | `GET` | `/api/jobs/eligible` | Student | Fetch CGPA-filtered eligible jobs |
| **Jobs** | `GET` | `/api/jobs/my-jobs` | Recruiter | Fetch posted jobs & applicant count |
| **Applications** | `POST` | `/api/applications/apply` | Student | Apply for a job opening |
| **Applications** | `GET` | `/api/applications/my-applications` | Student | Track submitted job applications |
| **Applications** | `GET` | `/api/applications/job/:jobId` | Recruiter | Review candidate applicants for job |
| **Applications** | `PUT` | `/api/applications/:id/status` | Recruiter | Update candidate application status |
