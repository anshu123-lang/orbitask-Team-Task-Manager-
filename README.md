# 🚀 Orbitask — Team Task Manager

A full-stack team task management application built with **Spring Boot** (Java) backend and a custom dark-themed orbital UI frontend.

---

## 🔑 Default Login Credentials

| Role  | Email                      | Password    |
|-------|----------------------------|-------------|
| Admin | admin@taskmanager.com      | Admin@123   |
| Member| alice@taskmanager.com      | Member@123  |
| Member| bob@taskmanager.com        | Member@123  |

---

## ✨ Features

- **JWT Authentication** — Secure login/signup with token-based auth
- **Role-Based Access Control** — Admin and Member roles with different permissions
- **Project Management** — Create, update, delete projects with team membership
- **Kanban Board** — Drag-and-drop task management across 4 columns
- **Task Tracking** — Priority levels, due dates, assignees, status tracking
- **Dashboard** — Live stats, donut chart, recent tasks, project progress
- **Admin Panel** — User management, role assignment

---

## 🛠 Tech Stack

**Backend**
- Java 17 + Spring Boot 3.2
- Spring Security + JWT
- Spring Data JPA
- H2 (dev) / PostgreSQL (production)
- Lombok, Validation

**Frontend**
- Vanilla HTML/CSS/JS (no framework)
- Custom dark orbital design system
- Drag-and-drop Kanban board
- Responsive layout

---

## 🚀 Running Locally

### Prerequisites
- Java 17+
- Maven 3.8+

```bash
# Clone the repo
git clone <your-repo-url>
cd team-task-manager

# Run
./mvnw spring-boot:run
```

App starts at: **http://localhost:8080**  
H2 Console: **http://localhost:8080/h2-console** (JDBC: `jdbc:h2:mem:taskdb`)

---

## 🌐 Deploy to Railway

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a **PostgreSQL** service
4. Set environment variables:

```
DATABASE_URL=jdbc:postgresql://<host>:<port>/<db>
DB_DRIVER=org.postgresql.Driver
DB_USERNAME=<pg_user>
DB_PASSWORD=<pg_password>
JPA_DIALECT=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=update
```

5. Deploy! Railway auto-detects the `pom.xml`.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint           | Description     |
|--------|--------------------|-----------------|
| POST   | /api/auth/signup   | Register user   |
| POST   | /api/auth/login    | Login & get JWT |

### Projects (auth required)
| Method | Endpoint                        | Description           |
|--------|---------------------------------|-----------------------|
| GET    | /api/projects                   | Get all projects      |
| POST   | /api/projects                   | Create project        |
| PUT    | /api/projects/{id}              | Update project        |
| DELETE | /api/projects/{id}              | Delete project        |
| POST   | /api/projects/{id}/members      | Add member            |
| DELETE | /api/projects/{id}/members/{uid}| Remove member         |

### Tasks (auth required)
| Method | Endpoint                          | Description         |
|--------|-----------------------------------|---------------------|
| GET    | /api/projects/{pid}/tasks         | Get project tasks   |
| POST   | /api/projects/{pid}/tasks         | Create task         |
| PUT    | /api/tasks/{id}                   | Update task         |
| PATCH  | /api/tasks/{id}/status            | Update task status  |
| DELETE | /api/tasks/{id}                   | Delete task         |

### Dashboard & Users
| Method | Endpoint               | Description       |
|--------|------------------------|-------------------|
| GET    | /api/dashboard/stats   | Dashboard stats   |
| GET    | /api/users             | List users (Admin)|
| PATCH  | /api/users/{id}/role   | Change role (Admin)|

---

## 📁 Project Structure

```
src/
├── main/
│   ├── java/com/taskmanager/
│   │   ├── config/         # Security, DataInitializer
│   │   ├── controller/     # REST controllers
│   │   ├── dto/            # Request/Response DTOs
│   │   ├── exception/      # Global error handling
│   │   ├── model/          # JPA entities
│   │   ├── repository/     # Spring Data repos
│   │   ├── security/       # JWT utils & filters
│   │   └── service/        # Business logic
│   └── resources/
│       ├── static/         # Frontend (HTML/CSS/JS)
│       └── application.properties
```
