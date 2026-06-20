# StudioSprint

A robust SaaS platform designed for indie studios. StudioSprint integrates powerful management tools with predictive machine learning algorithms to optimize project timelines, resource allocation, and critical path execution.

## 🚀 Tech Stack

- **Backend:** Laravel (PHP 8.3+)
- **Frontend:** React 18 with InertiaJS & Tailwind CSS 3
- **Database:** PostgreSQL (with `stancl/tenancy` for multi-tenancy)
- **Machine Learning Engine:** Python (FastAPI, Scikit-Learn, Pandas, DEAP)

## 🏗 Architecture & Tenancy (Global Hub -> Path-Based Routing)

When a new developer looks at the code, it's essential to understand the "big picture" of how users and workspaces are managed.

**The Multi-Tenant Flow:**
The system uses a **Global User Hub** approach. Users log into a central hub where their identity is verified. From there, they are routed to specific workspaces (tenants) they have access to.

**Routing Logic:**
We use **Path-Based Tenancy** (via `stancl/tenancy`). This means tenant context is derived from the URL path rather than subdomains. 
- Example: You will be working with URLs like `/studios/{studio-slug}/dashboard`.
- State and tenant context live entirely within this path prefix. Ensure any tenant-specific routes are wrapped in the appropriate tenancy middleware group.

## ⚙️ Local Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd indie-studio-saas
   ```

2. **Environment Variables:**
   Copy the example environment file. **Never assume default keys are enough!**
   ```bash
   cp .env.example .env
   ```

   **Custom Environment Variables Reference:**
   | Variable | Description |
   |----------|-------------|
   | `DB_CONNECTION` | Database driver (defaults to `pgsql`). |
   | `DB_DATABASE` | Your local database name (e.g., `indie_studio_db`). |
   | `AWS_*` | Used for S3 file storage (uploads/assets). |
   | `VITE_APP_NAME` | Frontend display name. |

3. **Install Dependencies:**
   ```bash
   composer install
   npm install
   ```

4. **Database Requirements:**
   Ensure your local environment has the **PostgreSQL** extension enabled (and **mysqli** if your setup requires connecting to legacy tables).

5. **Generate App Key:**
   ```bash
   php artisan key:generate
   ```

## 💾 Database, Migrations & ML Seeding

Because our application relies heavily on structured data for its algorithms, a standard database wipe-and-reload is not enough. The ML models expect exact categorical data structures.

**Seeding the ML Data:**
When running migrations locally, you must ensure the exact categorical data (like skill proficiency matrices, predefined roles, and historical project data) is seeded. This ensures your local environment mirrors the dataset structure required by the predictive models.

```bash
php artisan migrate:fresh --seed
```
*Note: Our seeders are specifically configured to generate the matrices the Random Forest models need.*

## 🧠 Algorithms (Random Forest & Critical Path execution)

Bridging web frameworks and complex algorithms can be tricky. Our ML logic lives in the `ml-engine/` directory.

**Predictive Models & The Sandbox:**
Our predictive algorithms (Random Forest) and optimization logic (DEAP) run as a separate service. 
- **Setup:** You need Python 3 installed.
  ```bash
  cd ml-engine
  python -m venv venv
  source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
  pip install -r requirements.txt
  ```
- **Running Locally:** The engine runs on FastAPI. You can start it using Uvicorn:
  ```bash
  uvicorn main:app --reload
  ```

**Scheduling Logic:**
The **Critical Path Algorithm** executes primarily within the Python ML service, but the coordination, payload generation, and response handling happen in our Laravel service classes. Check the `app/Services` directory for the PHP classes that dispatch tasks to the ML engine.

## 🤝 Contribution Workflow (Branching & Commits)

To keep our Git history clean and readable, please adhere to the following collaboration ground rules:

**Branch Naming Conventions:**
| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New features or additions | `feat/studio-dashboard` |
| `bugfix/` | Fixing a bug | `bugfix/tenant-routing-error` |
| `chore/` | Maintenance, dependencies, or refactoring | `chore/update-readme` |

**Commit Messages:**
We mandate the **Conventional Commits** format. This ensures our timeline remains readable and automated changelogs can be generated.
- `feat(db): initialized tables`
- `fix(routing): resolved path collision in hub`
- `docs(readme): added local setup instructions`

Always ensure tests pass and code is formatted before opening a Pull Request!
