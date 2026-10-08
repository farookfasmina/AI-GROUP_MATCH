# StudyMatch AI - AI-Powered Adaptive Study Group Matching Platform

Final year project, BSc (Hons) in Information Technology, Horizon Campus.
F.F. Fasmina (ITBIN-2211-0116) and S.F. Saheela (ITBIN-2211-0274). Supervisor: Ms. Anuradha Yapa.

Students describe their subjects, level per subject, study type (group or buddy), free time and social
preferences. The platform recommends study partners, forms balanced study groups, notifies students,
and lets groups chat, share files, plan sessions and rate their experience. The ratings retrain the model.

## How the AI works

| Step | What happens | Where |
|---|---|---|
| 1. KNN candidate retrieval | Each student becomes a weighted vector (subjects, 168 weekly free hours, study type, collaboration tendency, learning style, communication preference, competency). scikit-learn `NearestNeighbors` (cosine) finds the most similar students. | `backend/services/matching_service.py` |
| 2. Compatibility re-ranking | Each candidate pair is scored on 7 factors. Competency is *complementary* (one level apart scores highest), and two "driven leaders" score low together. | `matching_service.py` |
| 3. Group formation | For each subject, waiting students are split into groups of 3-5 (or buddy pairs). Hardest-to-place first, then hill-climbing swaps. Every group shares at least one free hour. | `backend/services/group_formation.py` |
| 4. Learning from feedback | Logistic regression on rated pairs (good = average rating of 4 or more) re-weights the 7 factors, blended with the current weights. | `optimize_matching_weights` |
| 5. Evaluation | Every run is compared with random grouping of the same students. Admin > Evaluation shows AI vs random, rating vs match score (Pearson r), attendance, SUS usability, fairness, and CSV exports. | `backend/routes/admin.py` |

No gender, ethnicity, religion or disability data is collected or used. Students give informed consent
before they are matched and can withdraw at any time (proposal: Ethics).

## Workflow

1. **Student:** register → consent → subjects and level → study style → free time → the AI looks for a group.
2. Notification → accept or decline the invitation → group page (members, why matched, chat with file sharing, sessions, attendance) → rate the group.
3. **My matches:** top 5 KNN study partners with score breakdown → request → partner accepts → private buddy group.
4. **Admin:** overview, run AI matching, factor weights, all groups, users, subject catalogue, evaluation, remove demo data.

## Run locally

Backend (Python 3.11):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # optional - works without it (SQLite)
uvicorn app.main:app --reload
```

Frontend (Node 20):

```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173 (calls the API on :8000)
```

Demo accounts (demo data is created on an empty database when `SEED_DEMO=true`):

- Student: `student@demo.lk` / `Demo@1234`
- Admin: `admin@studymatch.lk` / `Admin@1234` (locally; set `ADMIN_PASSWORD` on a server)

Demo students are flagged and can be removed with Admin > Overview > **Remove demo data**.
Demo ratings are simulated - they are not research results.

Or everything with Docker and PostgreSQL: `docker compose up --build` → http://localhost:8000

## Tests

```bash
cd backend
pip install -r requirements-dev.txt
python -m pytest -q
```

`tests/test_flow.py` runs the whole workflow (register, consent, preferences, KNN matches, partner request,
chat, sessions, feedback, AI group invitation, survey, admin evaluation, delete user, remove demo data).

## Deploy (Render, free)

1. Push this repository to GitHub.
2. On https://render.com: **New + → Blueprint**, pick the repository. `render.yaml` creates the web app and a free PostgreSQL database.
3. Enter `ADMIN_PASSWORD` when asked. After the first deploy, set `FRONTEND_URL` to the app address (used in reset emails).

Note: on the free plan, uploaded chat files are lost when the app restarts, and the free database expires after 30 days unless upgraded.

## Configuration

All settings are environment variables - see `backend/.env.example`. No passwords or keys are stored in the code.

## Tech stack

FastAPI, SQLAlchemy, PostgreSQL / SQLite, scikit-learn, JWT (python-jose), bcrypt · React 19, Vite, Tailwind CSS, React Router, Axios, Lucide icons.
