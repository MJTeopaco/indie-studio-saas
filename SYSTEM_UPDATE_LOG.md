# System Update Log & Startup Instructions

This document provides a summary of the latest features integrated from the `staging` branch and a step-by-step guide on how to start the application with these updates.

---

## 1. Updated Features by Category

The latest system updates unify deterministic scheduling calculations with modern deep-learning recommendation algorithms:

### ⏱️ Critical Path Analysis (CPA) Orchestration Engine
*   **Elastic Working-Hours Timeline:** Traditional rigid task dates (`start_date`, `due_date`) are replaced by an elastic timeline. Tasks are scheduled in relative business working hours (8 hours per day), and dependencies are defined as a Directed Acyclic Graph (DAG) in [cpa.py](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/ml-engine/orchestration/cpa.py).
*   **Critical Path Identification:** The engine automatically finds the longest chain of dependent tasks where any delay will push back the project release date. These critical tasks are marked with an amber flame icon in the timeline.
*   **Negative Float & Schedule Breaches:** When a task is delayed past the project's overall deadline or its intermediate milestone constraint (`hard_constraint_date`), the system flags a **Schedule Breached** warning in red with negative slack hours (e.g., `-8.0h float`).
*   **Dynamic Weekend Skipping:** The React frontend dynamically maps relative working hours back to calendar dates, automatically skipping weekends (Saturdays and Sundays) to show correct dates on the Gantt chart and Kanban board.
*   **Resource Booking Protection:** Validates developer assignments to prevent assigning a developer to multiple overlapping critical path tasks simultaneously.
*   *Documentation:* See [docs/CRITICAL_PATH_ANALYSIS.md](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/docs/CRITICAL_PATH_ANALYSIS.md) for architectural details.

### 🧠 AI-Powered Match Fit Recommendation System
*   **GNN Match Score Prediction:** Employs a pre-trained Graph Neural Network (GNN) model in [gnn.py](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/ml-engine/orchestration/gnn.py) to calculate a compatibility score ($0.00 \to 1.00$) between developers and tasks based on skills, role, experience, and current workload.
*   **22-Category central Skill Taxonomy:** Integrates a standardized taxonomy with 96 canonical skills (e.g. React, PostgreSQL, Docker). A semantic skill-centroid fallback translates unstructured skill entries into standardized categories.
*   **Cold-Start Matching:** If a studio does not have enough historical data for the GNN model, it falls back to text-embedding cosine similarity to recommend suitable candidates.
*   **Resource Deficit Warnings:** If all candidates score below $50\%$ suitability, the system highlights a capacity warning, recommending team upskilling or scheduling adjustments instead of a blind assignment.
*   *Documentation:* See [docs/AI_WORKSPACE_PROCESS.md](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/docs/AI_WORKSPACE_PROCESS.md) for data flow and vectorization architecture.

### ⚡ AI Sprint Decomposition & Auto-Chaining
*   **Sprint Breakdown:** Automatically decomposes project descriptions into detailed atomic tasks, estimating the required hours, difficulty, priority, and skills.
*   **Atomic Task Clamping:** Enforces a maximum limit of **40 hours** on individual tasks to ensure they remain manageable.
*   **Auto-Chaining:** Generates logical predecessor/successor chains between decomposed tasks so the project schedule is immediately CPA-ready.
*   **Inline Customization:** The sprint modal allows managers to rename tasks, edit hours, and manage canonical skills inline before saving.

### ☁️ Cloud LLM API Transition (Groq Integration)
*   **Fast Cloud Inference:** Retired the local ChatOllama LLM in favor of the cloud-hosted **Groq Cloud API** via LangChain's `ChatGroq`.
*   **Benefits:** Faster response times, no local GPU/CPU hardware requirement, and highly deterministic JSON outputs for intent parsing.

### 🗄️ Database Seeders & Testing Suite
*   **Developer Pool Seeder:** Adds 15 realistic developer profiles with detailed experience levels and skill ratings.
*   **Studio Seeder:** Sets up a test studio ("IndieCraft Studios") with domain mapping.
*   **Deterministic Tenant Seeder:** Seeds a 15-task project with a pre-configured DAG to validate CPA schedules and GNN recommendations out-of-the-box.

---

## 2. Startup Requirements & Laptop Status

To run all features, verify that your local environment is configured with the following active components:

### 💻 Local Device Status Checklist
1.  **PostgreSQL Service (Required - Running):**
    *   The database engine uses PostgreSQL. The service `postgresql-x64-18` must be running.
    *   *Verification:* Run `Get-Service postgresql-x64-18` in PowerShell. (It is currently **Running**).
2.  **Node.js & npm (Required):**
    *   Installed Node.js version is **v24.13.1** and npm is **11.8.0**.
3.  **Python Environment (Required):**
    *   Installed Python version is **v3.14.0**. A virtual environment (`venv`) is present in `ml-engine/` for running the ML microservice.
4.  **PHP & Composer (Required):**
    *   Standard PHP 8.3+ is installed.
    *   > [!NOTE]
    *   Laravel Feature Tests rely on SQLite in-memory databases. Because the local PHP configuration currently lacks the SQLite extensions (`php_sqlite3.dll` / `php_pdo_sqlite.dll`), running `php artisan test` will fail. This does not affect the main application, which runs successfully on the PostgreSQL service.

---

## 3. Step-by-Step Launch Guide

Follow these steps in order to start and run the application:

### Step 1: Configure ML Engine Environment
1.  Navigate to the `ml-engine` directory.
2.  Copy [ml-engine/.env.example](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/ml-engine/.env.example) to create a new file `ml-engine/.env`:
    ```powershell
    copy .env.example .env
    ```
3.  Open `ml-engine/.env` and insert your Groq API key:
    ```ini
    GROQ_API_KEY=gsk_your_actual_groq_api_key_here
    ```
    *Note: Get your key from the [Groq Console](https://console.groq.com/keys).*

### Step 2: Start the Python ML Engine API
Open a terminal, activate the virtual environment, and run the FastAPI server on port 8001:
```powershell
cd d:/xampp_latest/htdocs/thesis1/indie-studio-saas/ml-engine
.\venv\Scripts\activate
uvicorn main:app --reload --port 8001
```
*The ML microservice will be available at `http://127.0.0.1:8001/health`.*

### Step 3: Run the Laravel Application & Vite Server
Open a **new separate terminal** in the project root [indie-studio-saas](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas) and run:
```powershell
cd d:/xampp_latest/htdocs/thesis1/indie-studio-saas
composer dev
```
This runs `npx concurrently` to start three processes simultaneously:
1.  **Laravel Web Server:** Serves the app at `http://127.0.0.1:8000`.
2.  **Laravel Queue Listener:** (`php artisan queue:listen`) **CRITICAL** for processing project schedule recalculations asynchronously when tasks change.
3.  **Vite Asset Compiler:** Compiles frontend React assets.

### Step 4: Seed Database & Set Up Demo Studio
To load the developer pool and the 15-task CPA/GNN demo project, run these commands in a third terminal:
1.  **Run Central Seeders:** (Populates lookup tables and developer profiles)
    ```powershell
    php artisan db:seed
    ```
2.  **Run Tenant Seeders:** (Populates the "IndieCraft Studios" database with projects and tasks)
    ```powershell
    php artisan tenants:run "db:seed" --option="class=TenantSeeder"
    ```

### Step 5: Access the Application
Open your browser and navigate to the local URL:
*   **Central Portal:** `http://localhost:8000`
*   **Demo Studio Dashboard:** `http://indiecraft-studios.localhost:8000` (or `http://localhost:8000/tenant/indiecraft-studios` depending on tenancy path routing).
*   **Seeded Test Credentials:**
    *   **Studio Manager:** `manager@example.com` (Password: `password123`)
    *   **Central Admin:** `admin@example.com` (Password: `password123`)
