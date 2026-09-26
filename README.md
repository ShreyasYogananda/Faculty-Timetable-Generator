# Faculty Timetable Generator
Varsg is a full-stack web application for managing faculty, departments, subjects, and sections, and for automatically generating class timetables. It was built as a MERN-stack project (MongoDB, Express, React, Node.js).

## Features

- **Admin Dashboard** — central overview of the system
- **Faculty Management** — add, update, and remove faculty, including their subject, department, section, and weekly availability
- **Department & Subject Management** — organize subjects under departments
- **Section Management** — manage sections by department, academic year, and (where applicable) cycle
- **Automatic Timetable Generation** — generate a timetable per department/section from faculty availability
- **Timetable View** — view generated timetables
- **Reports** — reporting view for generated data
- **Configurable Settings** — working hours, period duration, number of periods, and break times

## Tech Stack

**Frontend**
- React 19 (Vite)
- React Router
- React Select

**Backend**
- Node.js + Express
- MongoDB with Mongoose
- dotenv, cors

## Project Structure

```
Varsg/
├── package.json               # Backend dependencies & scripts
└── server/
    ├── index.js                # Express app entry point
    ├── config/
    │   └── db.js                # MongoDB connection
    ├── models/                  # Mongoose schemas (Faculty, Department, Subject, Section, Settings, Timetable)
    ├── controllers/             # Route handler logic
    ├── routes/                  # Express route definitions
    ├── seed/                    # Database seed scripts
    ├── utils/
    │   └── timetableGenerator.js
    └── client/                  # React frontend (Vite)
        └── src/
            ├── pages/            # AdminDashboard, FacultyManagement, TimetableView, Reports, Settings
            ├── components/       # Header, DashboardCard
            ├── services/         # API client (api.js)
            └── constants/
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- A MongoDB database (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/varsg.git
cd varsg
```

### 2. Set up the backend

```bash
npm install
```

Create a `.env` file in the project root (see [Environment Variables](#environment-variables) below):

```
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

Start the backend server:

```bash
npx nodemon server/index.js
```

The API will run at `http://localhost:5000`.

### 3. Set up the frontend

```bash
cd server/client
npm install
npm run dev
```

The frontend will run at `http://localhost:5173` (Vite default) and is configured to talk to the backend at `http://localhost:5000`.

### 4. (Optional) Seed the database

Sample seed scripts are available in `server/seed/`:

```bash
node server/seed/seedDepartmentsAndSubjects.js
node server/seed/seedSections.js
```

## Environment Variables

| Variable    | Description                          |
|-------------|---------------------------------------|
| `MONGO_URI` | MongoDB connection string             |
| `PORT`      | Port for the Express server (default: 5000) |

> **Note:** Never commit your `.env` file. It's already excluded via `.gitignore`.

## API Overview

| Method | Endpoint                          | Description                          |
|--------|------------------------------------|---------------------------------------|
| GET    | `/api/departments`                | List all departments                  |
| GET    | `/api/subjects`                   | List all subjects                     |
| GET    | `/api/faculty`                    | List all faculty                      |
| GET    | `/api/faculty/:id`                | Get a single faculty member           |
| POST   | `/api/faculty`                    | Create a faculty member                |
| PUT    | `/api/faculty/:id`                | Update a faculty member                |
| DELETE | `/api/faculty/:id`                | Delete a faculty member                |
| GET    | `/api/sections`                   | List all sections (or filter by `?departmentId=`) |
| POST   | `/api/sections`                   | Create a section                       |
| PUT    | `/api/sections/:id`               | Update a section                       |
| DELETE | `/api/sections/:id`               | Delete a section                       |
| POST   | `/api/timetable/generate`         | Generate a timetable (`?departmentId=`) |
| GET    | `/api/timetable`                  | Get a timetable (`?departmentId=`)      |
| DELETE | `/api/timetable`                  | Delete a timetable (`?departmentId=`)   |
| GET    | `/api/settings`                   | Get system settings                    |
| PUT    | `/api/settings`                   | Update system settings                 |
| POST   | `/api/settings/reset`             | Reset settings to defaults             |

## License

This project currently has no license specified. Add one (e.g. MIT) if you plan to make the repository public and accept contributions.
