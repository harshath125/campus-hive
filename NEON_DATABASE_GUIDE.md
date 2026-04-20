# Campus Hive — Neon PostgreSQL Database Guide

This guide explains how Campus Hive interacts with Neon.tech, how data is stored, and how you can manage and monitor your production database.

---

## 1. What is Neon DB?
Neon is a modern, cloud-native **Serverless PostgreSQL** database. 
Unlike traditional databases that run continuously, Neon separates its computing power from its storage. This allows it to automatically "go to sleep" to save resources when no one is using the website, and "auto-wake" in milliseconds when a request comes in.

## 2. How the Connection (Redirection) Works
Your Django backend (hosted on Render) communicates with Neon securely over the internet.

1. **The URL**: In Render's environment variables, we set `DATABASE_URL`.
   `postgresql://neondb_owner:npg_****@ep-soft-math-....aws.neon.tech/neondb?sslmode=require`
2. **The Adapter**: Django uses a library called `psycopg` to translate Python code into raw SQL queries.
3. **The Redirection**: When a user on Vercel (Frontend) creates an account, Vercel sends an HTTP POST to Render (Backend). Render transforms this into an SQL `INSERT` statement and securely beams it to the Neon URL. Neon processes the query and saves it to its AWS-backed storage layer.

## 3. How Data is Stored (Schemas & Tables)
When Django connected to Neon for the first time, it ran `manage.py migrate`. This command generated the **Schema** (the structural blueprint of the database).

Inside Neon, your schema consists of several distinct relational tables:
*   **`core_user`**: Stores all accounts, passwords, email addresses, and vibe tags.
*   **`core_event`**: Stores event names, dates, and locations.
*   **`core_poll`**: Stores poll questions and creator IDs.
*   **`core_viberequest`**: Stores the graph of who matched with whom.

Because it is a relational database (SQL), tables are linked. For example, a `core_viberequest` doesn't store a full user profile; it stores the `id` of the user from the `core_user` table (this is called a Foreign Key).

## 4. How to Manage Data in Neon
You do not need to write raw SQL code to manage your data! You have three ways to manage your Neon data:

### Method A: The React Admin Panel (Easiest)
*   **URL**: `https://<your-vercel-link>/admin-login`
*   Upload CSVs, view statistics, and block users graphically.

### Method B: The Django Admin Panel (Advanced)
*   **URL**: `https://<your-render-link>/admin/`
*   Built-in tool to selectively edit individual database columns.

### Method C: The Neon SQL Editor (Direct)
1. Log into your account at **Neon.tech**.
2. Click the **"SQL Editor"** tab on the left.
3. This allows you to run raw SQL queries directly against the live database.
**Syntax Examples for SQL Editor:**
```sql
-- See all users
SELECT * FROM core_user;

-- Count how many students joined
SELECT COUNT(*) FROM core_user WHERE is_staff = false;

-- Find a user by email
SELECT name, branch, vibe_score 
FROM core_user 
WHERE email = 'student@campushive.com';

-- Delete a specific poll manually
DELETE FROM core_poll WHERE id = 5;
```

## 5. Monitoring & Analytics in Neon
Neon provides an incredible Dashboard for monitoring database health.
1. Log into **Neon.tech** and open your project.
2. Click the **"Dashboard"** or **"Metrics"** tab.
3. **What to look for:**
   *   **Active Time:** Shows exactly when your database woke up to process a request and when it went to sleep.
   *   **Storage Usage:** Shows how much of your 0.5 GB free limit is used (text data takes up virtually zero space; 500 records is less than 0.001 GB!).
   *   **Compute Data:** Shows CPU and RAM usage. If an ML algorithm runs a heavy query, you will see a spike here.

## 6. Exporting and Backing Up Data
If you ever want to download your live production data back to your local laptop:
1. Go to Neon.tech → **SQL Editor**.
2. Run `SELECT * FROM core_user;`
3. Around the results table, there is an option to **"Export as CSV"**. 
4. You can also run the Django dump command locally using your Neon URL to pull the entire JSON blueprint.
