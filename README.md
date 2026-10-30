# Student Management System 🎓

A full-stack student information management system with Node.js/Express backend, MongoDB Atlas database, and responsive frontend UI, containerized and configured for one-click deployment on Render.

---

## 📁 Project Structure

```text
StudentManagement/
├── backend/
│   ├── .env               # Environment configuration (MongoDB URI, Port, CORS)
│   ├── package.json       # Backend dependencies (Express 5, Mongoose, CORS, Dotenv)
│   ├── server.js          # REST API & static asset server
│   └── node_modules/      # Installed dependencies
├── frontend/
│   ├── index.html         # User interface & student records table
│   ├── style.css          # Theme styles with custom CSS variables
│   └── script.js          # Dynamic API connection & CRUD client
├── Dockerfile             # Production container for Render deployment
├── .dockerignore          # Docker build exclusion rules
├── render.yaml            # Render Blueprint specification
├── package.json           # Root convenience scripts
└── README.md              # Project documentation & instructions
```

---

## ⚡ Connected Frontend & Backend Architecture

The frontend and backend are now fully connected with auto-resolving endpoints:

| Environment | Frontend Behavior | Target API |
| :--- | :--- | :--- |
| **Local (Node Server)** | Visited via `http://localhost:5000` | Same-origin `/api/students` |
| **Local (Live Server)** | Visited via `http://localhost:5500` or `file://` | `http://localhost:5000/api/students` |
| **Render Container** | Visited via `https://<your-render-url>.onrender.com` | Same-origin `/api/students` |
| **Manual Override** | Set `<script>window.API_URL = "...";</script>` | Custom URL |

Backend features:
- Serves the frontend directly from `frontend/` so a single container hosts both UI and API.
- Comprehensive REST endpoints (`/api/students`, `/api/students/:id`, etc.).
- Health checks at `/health` and `/api/health` for Render zero-downtime health probes.
- CORS enabled for cross-origin access if needed.

---

## 🚀 Running Locally

### Start Backend + Frontend Together
```bash
npm start
```
Then open your browser at:
```
http://localhost:5000
```

---

## 🐳 Deploying & Updating Container on Render

### Method 1: Render Container (Docker)
1. Push this folder to a GitHub / GitLab repository.
2. In [Render Dashboard](https://dashboard.render.com):
   - Click **New +** -> **Web Service**.
   - Select your repository.
   - Choose **Docker** as the runtime (Render will automatically detect `Dockerfile`).
   - Set Environment Variables:
     - `PORT`: `5000`
     - `MONGODB_URI`: `mongodb+srv://...` (your MongoDB Atlas connection string)
     - `FRONTEND_URL`: `*`
3. Click **Deploy Web Service**.

### Method 2: Render Blueprint (One-Click)
1. In Render Dashboard, click **New +** -> **Blueprint**.
2. Connect your repository. Render reads `render.yaml` automatically and configures the container service and health checks.

---

## 💬 Giving Commands to Antigravity

Your project is actively loaded in this workspace. You can prompt me at any time with commands like:

- **Change Background**: *"Change background to a dark modern slate theme"* or *"Change the background to a deep purple-blue gradient"*
- **Add / Update Containers**: *"Add a container for Student Attendance / Grade statistics"* or *"Add a modern card container with student count summary"*
- **Update Render Container**: *"Update the Dockerfile for multi-stage build"* or *"Change Render port or healthcheck configuration"*
- **Add Fields**: *"Add an enrollment date and blood group field to the form and table"*
