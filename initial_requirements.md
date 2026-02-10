# Initial Requirements & Technical Specifications

> [!NOTE]
> This document serves as the foundation for the hardware specification and deployment plan. It is based on the current codebase analysis and requires user input for operational details.

## 1. Application Architecture & Stack

### Tech Stack

- **Languages & Frameworks:**
  - **Frontend:** React 19, Vite, TypeScript, TailwindCSS v4.
  - **Backend / Database:** [Supabase](https://supabase.com) (PostgreSQL, Auth, Storage, Realtime).
  - **AI/ML:** Google Gemini API (`@google/genai`) - Currently implemented via client-side/service calls.
  - **Python Component (Status TBD):** There is a `backend/` directory with FastAPI and Python requirements, but it is not currently linked in the main `docker-compose.yml`.
    - **Question for User:** Is the Python backend active or planned to be used? Or is all logic handled by Supabase/Client? the Backend is gonna be finished for usage.
    - **Answer from User:** The backend is gonna be finished for usage.

### Containerization

- **Current State:**
  - **Docker:** Uses `Dockerfile` (Node.js build -> Nginx serve) and `docker-compose.yml`.
  - **Deployment:** Currently configured for a single container (`web`) serving the frontend on port 8080.

### Database Engine

- **Primary:** PostgreSQL (via Supabase).
- **Location:** Likely cloud-hosted (Supabase) based on `VITE_SUPABASE_URL` in `docker-compose.yml`.
- **Question for User:** Are you using a self-hosted Supabase instance (Docker) or the managed cloud version? This heavily impacts hardware requirements.
- **Answer from User:** We are using a cloud hosted Supabase instance, but we are planning to move it to a self-hosted instance in the near future.

### Background Workers

- **Current State:** No dedicated worker containers (e.g., Celery/Redis) found in `docker-compose.yml`.
- **Asynchronous Tasks:** CSV parsing and PDF generation (`jspdf`, `csv-parse`) seem to happen client-side.
- **Question for User:** Do you plan to move heavy processing (like OCR or large file parsing) to a background worker?
- **Answer from User:** Yes, I want to move heavy processing to a background worker or the backend.

---

## 2. Computational Workload (CPU & RAM)

### Nature of Processing

- **Client-Side:** PDF generation/parsing appears to be done in the browser (distributed workload).
- **Server-Side:**
  - If using Supabase Cloud: Server load is minimal (serving static assets via Nginx).
  - If Self-Hosting Supabase: Database load will be the primary factor.
  - If Python Backend is active: Needs CPU for API requests.

### Memory Footprint

- **Nginx (Frontend):** Very low (< 100MB).
- **Python Backend (if active):** ~200-500MB depending on ML models loaded.
- **Question for User:** roughly how much RAM does a single idle instance of the app consume? (If known).
- **Answer from User:** We need to develop some tests to determine this.

### Concurrency

- **Question for User:** How many simultaneous users or connections do you expect? (e.g., is this for just you and a few assistants, or the whole company?)
- **Answer from User:** We expect to have around 20 users in the first year, but we want to be able to scale to 100 users in the future.

---

## 3. Storage & Data Persistence (Disk)

### Data Volume

- **Question for User:** What is the expected size of the database now, and what is the growth rate per month?
- **Answer from User:** We need to develop some tests to determine this.

### Asset Storage

- **Current:** `react-dropzone` suggests file uploads.
- **Question for User:** Does the app store large files (PDFs, images) locally? If so, what is the average file size?
  - _Note:_ If using Supabase Storage, files are typically stored in S3-compatible buckets, not local disk (unless self-hosted).
- **Answer from User:** We need to develop some tests to determine this.

### Read/Write Ratio

- **Question for User:** Is the app mostly reading data (reporting) or heavily writing data (logging, importing batches of files)?
- **Answer from User:** We need to develop some tests to determine this.

---

## 4. Network & Accessibility

### Access Pattern

- **Question for User:** Will this be accessed only via the local network (Intranet/LAN) or must it be exposed to the public internet?
- **Answer from User:** We will only access the app via the local network at first, but we want to be able to access it from the internet in the future.

### Traffic Volume

- **Question for User:** Do you expect bursty traffic (e.g., end-of-month reporting) or a steady stream?
- **Answer from User:** We expect to have a steady stream of traffic, but we want to be able to handle bursty traffic on weekends (friday to sunday).

---

## 5. Operational Constraints (The "In-House" Factor)

### Availability

- **Question for User:** Can the server go down for maintenance at night, or does it need 99.9% uptime?
- **Answer from User:** The server can be maintained at night or scheduled times.

### Backup Strategy

- **Question for User:** Where will backups go? (You cannot store backups on the same drive as the OS).
- **Answer from User:** Our server will have a backup drive.

### Physical Environment

- **Question for User:** Where will this server physically live? (e.g., An air-conditioned server room, a closet, or under a desk? This dictates thermal constraints).
- **Answer from User:** An ar-conditioned server room.
