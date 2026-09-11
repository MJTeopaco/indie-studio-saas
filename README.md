# StudioSprint

A robust SaaS platform designed for indie studios. StudioSprint integrates powerful management tools with predictive machine learning algorithms to optimize project timelines, resource allocation, and critical path execution.

## 🚀 Tech Stack

- **Backend:** Laravel (PHP 8.3+)
- **Frontend:** React 18 with InertiaJS & Tailwind CSS 3
- **Database:** PostgreSQL (with `stancl/tenancy` for multi-tenancy)
- **Machine Learning Engine:** Python (FastAPI, Scikit-Learn, Pandas, DEAP)

## 🏗 Architecture & Tenancy (Global Hub -> Path-Based Routing)

When a new developer looks at the code, it's essential to understand the "big picture" of how users and workspaces are managed in our architecture.

### 1. The Global User Hub
The application does not have a single entry point for all users. Instead, it utilizes a **Global User Hub**. 
- **Authentication:** All users authenticate against a central database (the "landlord" database).
- **Workspace Resolution:** Once logged in, the hub determines which specific studios (workspaces) the user belongs to and what their role is in each. 
- **Central Dashboard:** The hub acts as a launching pad. Users select the studio they want to work on and are then routed into that specific tenant's context.

### 2. Path-Based Tenancy (Workspace Routing)
Once a user selects a studio from the Hub, they are redirected into the tenant context. We use **Path-Based Tenancy** (powered by `stancl/tenancy`).

- **How it Works:** Instead of creating physical subdomains (like `studio1.domain.com`), the tenant ID (or slug) is injected directly into the URL path. 
- **Example URL:** You will be working with URLs like `/studios/{studio-slug}/dashboard`.
- **The Magic:** When a request hits a URL matching `/studios/{tenant}`, the `InitializeTenancyByPath` middleware intercepts it. It extracts the `{tenant}` parameter, switches the active database connection to that specific studio's database, sets up the tenant context, and then removes the `{tenant}` parameter from the route so our controllers don't have to manually manage it.
- **Developer Rule:** State and tenant context live entirely within this path prefix. You must ensure any tenant-specific routes are wrapped in the `tenant` middleware group so the context switch happens automatically.

## ⚙️ Local Setup & Installation

To run this platform locally, you will need to install a few foundational technologies. Please ensure you have downloaded and installed the following prerequisites before proceeding:

### Prerequisites (What to Download)
- **PHP (8.3+)**: Required to run the Laravel backend. [Download PHP](https://windows.php.net/download/)
- **Composer**: The dependency manager for PHP. [Download Composer](https://getcomposer.org/download/)
- **Node.js (LTS)**: Required for compiling the React/InertiaJS frontend assets. [Download Node.js](https://nodejs.org/)
- **PostgreSQL**: Our primary database engine. You will need the Postgres server running locally. [Download PostgreSQL](https://www.postgresql.org/download/)
- **Python (3.10+)**: Required to run the Machine Learning Engine (FastAPI). [Download Python](https://www.python.org/downloads/)

### Installation Steps

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
   | `DB_DATABASE` | Your local central database name (e.g., `indie_studio_db`). |
   | `AWS_*` | Used for S3 file storage (uploads/assets). |
   | `VITE_APP_NAME` | Frontend display name. |

3. **Install Dependencies:**
   Install both PHP packages and JavaScript node modules:
   ```bash
   composer install
   npm install
   ```

4. **Database Configuration:**
   - Make sure your local **PostgreSQL** server is running.
   - Ensure your PHP installation has the `pdo_pgsql` extension enabled (and `mysqli` if your setup requires connecting to legacy tables).
   - Create a central database in Postgres (e.g., `indie_studio_db`) to match your `.env` file.

5. **Generate App Key:**
   ```bash
   php artisan key:generate
   ```

## 💾 Database, Migrations & ML Seeding

Because our application relies heavily on structured data for its algorithms, a standard database wipe-and-reload is not enough. The ML models expect exact categorical data structures.

**Seeding the ML Data:**
When running migrations locally, you must ensure the exact categorical data (like skill proficiency matrices, predefined roles, and historical project data) is seeded. This ensures your local environment mirrors the dataset structure required by the predictive models.

To remigrate and reseed the entire database, including the tenants databases, run the following commands:
```bash
php artisan migrate:fresh --seed
php artisan tenants:migrate-fresh
```

To reseed the tenant databases with test data, you can use the `TenantSeeder`:

* TenantSeeder
* ============================================================================
* Seeds one demo project with 15 tasks into the current tenant database.
* Run via: `php artisan tenants:run "db:seed" --option="class=TenantSeeder"`

*Note: Our seeders are specifically configured to generate the matrices the Random Forest models need.*

## 🧠 Machine Learning Engine Setup

Our ML logic lives in the `ml-engine/` directory. It must be running alongside the main Laravel application for predictive features to work.

1. **Setup Python Environment:**
   ```bash
   cd ml-engine
   python -m venv venv
   source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
   pip install -r requirements.txt
   ```

2. **Run the FastAPI Server:**
   The engine runs on FastAPI. You can start it using Uvicorn:
   ```bash
   cd ml-engine
   ./venv/Scripts/uvicorn main:app --host 127.0.0.1 --port 8001 --reload
   ```
