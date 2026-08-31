# 🚀 Hosting Zubyte Backend on Render

This guide outlines the step-by-step process to deploy the **Express.js & MongoDB REST API** to [Render](https://render.com) for free with zero downtime.

---

## 📋 Prerequisites
1. A [GitHub](https://github.com) account with your Zubyte project repository pushed.
2. A free [Render.com](https://render.com) account.
3. Your **MongoDB Atlas Connection URI**.
4. Your **Cloudinary Credentials** (`h8vtnbby`).

---

## 🛠️ Option 1: Fast Blueprint Deployment (Recommended)

Render will automatically detect [`render.yaml`](./render.yaml) in your repository:

1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** → **Blueprint**.
3. Select your **Zubyte repository**.
4. Render will read `render.yaml` and configure the web service automatically.
5. Fill in the required secret environment variables (MongoDB URI, Cloudinary API Key, etc.) when prompted.
6. Click **Apply**.

---

## 🛠️ Option 2: Manual Web Service Deployment

If you prefer to configure manually:

### Step 1: Create a New Web Service on Render
1. Go to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository (`zubyte`).

### Step 2: Configure Service Settings
| Setting | Value |
| :--- | :--- |
| **Name** | `zubyte-backend` (or your preferred name) |
| **Region** | `Oregon (US West)` or closest to your users |
| **Branch** | `main` |
| **Root Directory** | `backend` *(Leave empty if backend is in root)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan Type** | `Free` |

---

### Step 3: Configure Environment Variables

Under the **Environment Variables** section in Render, add the following key-value pairs:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production environment mode |
| `PORT` | `10000` | Port provided by Render |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/zubyte_db?retryWrites=true&w=majority` | Your MongoDB Atlas connection URI |
| `JWT_SECRET` | *(Random 32+ character string)* | Secret for signing JWT authentication tokens |
| `JWT_EXPIRE` | `7d` | Token validity duration |
| `CLOUDINARY_CLOUD_NAME` | `h8vtnbby` | Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | *(Your Cloudinary API Key)* | Cloudinary API Key from console |
| `CLOUDINARY_API_SECRET` | *(Your Cloudinary API Secret)* | Cloudinary API Secret from console |
| `CLIENT_URL` | `https://your-frontend.vercel.app,http://localhost:3000` | Allowed frontend URLs for CORS (or `*`) |

---

### Step 4: Health Check (Optional but Recommended)
Under **Advanced**:
- **Health Check Path**: `/api/health`

---

### Step 5: Deploy & Verify
1. Click **Create Web Service**.
2. Render will build and launch your backend service.
3. Once the deployment finishes, your service URL will look like:
   `https://zubyte-backend.onrender.com`
4. Test the health endpoint in your browser:
   `https://zubyte-backend.onrender.com/api/health`
   **Expected Response:**
   ```json
   {
     "success": true,
     "message": "Success",
     "data": {
       "status": "online",
       "service": "Zubyte Backend API",
       "environment": "production"
     }
   }
   ```

---

## 🔗 Step 6: Connect Frontend to Render Backend

Once your backend is live on Render:

1. In your **Frontend (`frontend/.env.local` or Vercel Environment Variables)**:
   ```env
   NEXT_PUBLIC_API_URL=https://zubyte-backend.onrender.com/api
   ```
2. Redeploy or restart your frontend, and all public pages and admin forms will communicate with your live Render backend!

