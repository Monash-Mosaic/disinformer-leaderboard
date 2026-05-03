# 🚀 Firebase + Next.js Deployment Guide

This project is deployed using **Firebase App Hosting** with a Next.js frontend and Firestore backend.

---

## 📦 Tech Stack

- Next.js (App Router)
- Firebase App Hosting
- Firestore Database
- Firebase Admin SDK (server-side where needed)

---

## ⚙️ Prerequisites

Before deployment ensure:

- **Firebase CLI installed**

  ```bash
  npm install -g firebase-tools
  ```

- **Logged in to Firebase**

  ```bash
  firebase login
  ```

- **Correct Firebase project selected**

---

## 🔗 Firebase Project Setup

Project linking is stored in `.firebaserc`.

Ensure it contains correct project ID:

```json
{
  "projects": {
    "default": "YOUR_PROJECT_ID"
  }
}
```

---

## 📁 Important Config Files

| File | Purpose |
| --- | --- |
| `firebase.json` | Firebase hosting & app config |
| `apphosting.yaml` | Next.js App Hosting build config |
| `.firebaserc` | Firebase project mapping |

---

## 🚀 Deployment Steps

1. **Build locally (optional)**

   ```bash
   npm run build
   ```

2. **Deploy to Firebase**

   ```bash
   firebase deploy
   ```

This will:

- Build Next.js app
- Upload to Firebase App Hosting
- Deploy backend + frontend together

---

## 🌐 After Deployment

Firebase will provide:

- Live URL (e.g. `https://your-app.web.app`)

---

## 🔄 Updating the Application

To update the app:

### Step 1 — Make code changes

Edit your Next.js / Firestore logic.

### Step 2 — Commit changes

```bash
git add .
git commit -m "Update feature/fix"
git push origin main
```

### Step 3 — Deploy again

```bash
firebase deploy
```

---

## 🔐 Environment Variables

Set env variables in Firebase Console:

- Firebase Project → App Hosting → Environment Variables

Examples:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
```
