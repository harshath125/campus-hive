# 🚀 Campus Hive — Continuous Deployment & CI/CD Guide

> A step-by-step guide to deploying Campus Hive on Render.com and setting up a seamless Continuous Integration / Continuous Deployment (CI/CD) pipeline.

---

## Part 1: Connecting Local Code to GitHub

Before deploying to Render, your code needs to live on GitHub. We have automated this process with a batch script.

### Step 1: Create an empty repository on GitHub
1. Go to [github.com/new](https://github.com/new) and log in.
2. Give your repository a name (e.g., `campus-hive`).
3. Set the repository to **Private** (recommended for projects with API keys, although `.gitignore` prevents uploading the `.env` file anyway).
4. Do NOT check "Add a README file" or "Add .gitignore" (we already have these).
5. Click **Create repository**.
6. Copy the repository URL (e.g., `https://github.com/username/campus-hive.git`).

### Step 2: Push your code using the batch file
We created a batch file that handles Git initialization, staging, and pushing automatically.

1. Navigate to the `batch` folder in your project: `c:\Users\harsh\OneDrive\Desktop\vibe project\batch\`
2. Double-click **`push_to_github.bat`**.
3. **First Run Only**: It will ask for your GitHub Repo URL. Paste the URL you copied from Step 1 and press Enter.
4. **Commit Message**: It will ask for a commit message. You can type something like `Initial deployment setup` or just press Enter to use the auto-generated timestamp.
5. The script will securely push your code to the `main` branch.

> 🛡️ **Safety Check**: The script automatically uses our `.gitignore` to ensure sensitive files like `.env`, `db.sqlite3` (your local DB), and `node_modules` are **never** uploaded to the internet.

---

## Part 2: First-Time Deployment on Render (Hosting)

Render reads our `render.yaml` configuration file and automatically knows exactly how to build and serve Campus Hive.

### Step 1: Create a Render Account
1. Go to [render.com](https://render.com/) and sign up using your GitHub account.

### Step 2: Deploy using Blueprint (The easiest way)
Because we created a `render.yaml` file, you can deploy the entire stack in one click.

1. On the Render Dashboard, click **New +** and select **Blueprint**.
2. Connect your GitHub account if prompted, and select the `campus-hive` repository.
3. Render will scan the repository, find the `render.yaml` file, and prepare to deploy a **Web Service** named `campus-hive`.
4. Click **Apply**.

### Step 3: Inject Environment Variables (CRITICAL)
Render needs your secret API keys. Since these are in `.env` (which we securely excluded from GitHub), you must manually enter them into Render.

1. In the Render Dashboard, click on your newly created `campus-hive` web service.
2. Go to **Environment** in the left sidebar.
3. Add the following variables:
   - Key: `GEMINI_API_KEY`  → Value: `<Paste your Google AI Studio API Key>`
   - Key: `DATABASE_URL` → Value: `<Paste your Supabase URL>` (If you want to use the local SQLite fallback, you can skip this, but Supabase is recommended for production).
4. Click **Save Changes**.

### Step 4: Wait for the Build
Render will now read the `Dockerfile`, download Python and Node.js, build the React frontend, and start the Django server using Gunicorn.
- Click on **Logs** to watch the process.
- When you see `Starting gunicorn`, your project is live!
- Click the URL at the top left of the dashboard (e.g., `https://campus-hive-abc1.onrender.com`) to visit your live site.

---

## Part 3: Continuous Integration / Continuous Deployment (CI/CD)
How do you push updates without breaking the live site? Following this workflow guarantees zero downtime and a smooth update cycle.

### The CI/CD Workflow

Once connected, Render watches your GitHub repository. **Any time new code gets pushed via the batch file, Render will automatically rebuild and restart the live site.**

#### Scenario: Making a Change and Re-deploying
Let's say you changed the CSS on the landing page or updated the algorithm logic.

1. Test the changes locally first (using your `start_all.bat`).
2. If it works locally, double-click `batch/push_to_github.bat`.
3. Type a descriptive commit message: e.g., `Updated landing page colors`.
4. As soon as the batch file says "DONE!", go to your Render Dashboard.
5. You will see a new deployment starting automatically.
6. Render performs a **Zero-Downtime Deployment**: The old version of your site stays live until the new version is fully compiled and ready. Once ready, it effortlessly swaps them. 

### How to Avoid Errors in Production

*   **Don't upload local databases**: Our `.gitignore` prevents `db.sqlite3` from uploading. Your production Render site will naturally build its own SQLite database (or connect to Supabase) and run migrations automatically via the Dockerfile `CMD`.
*   **Database Migrations**: If you change `models.py`, you must run `python manage.py makemigrations` locally, test them, and then use the `push_to_github.bat`. The live server will run `python manage.py migrate` automatically on startup (as defined in our Dockerfile).
*   **Environment Variables**: If you add a new feature that requires a new API key (e.g., sending emails via SendGrid), test it locally by adding it to `.env`. Before you push the code, go to the Render Dashboard -> Environment and add the key there first.
*   **Debugging errors**: If a deployment fails on Render, the old version of the site remains active. Click on **Logs** in the Render Dashboard to see why the build crashed (usually a missing dependency in `requirements.txt` or a syntax error).

---

## Summary Checklist for Project Expo

1. [ ] Code pushed to GitHub private repo
2. [ ] Render Blueprint deployed via `render.yaml`
3. [ ] `GEMINI_API_KEY` added directly in Render Environment settings
4. [ ] Tested the live URL on a mobile device and laptop
5. [ ] Used the `push_to_github.bat` file to seamlessly push a small typo fix just to verify the CI/CD pipeline triggers correctly on Render.
