# Firebase Environment Variables Setup Guide

This guide explains how to obtain and configure the Firebase environment variables required for the Disinformer Leaderboard project.

## Prerequisites

- A Google account
- Access to the [Firebase Console](https://console.firebase.google.com/)

## Step 1: Create or Access Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one with id `disinformer-d40c6`
3. If creating a new project:
   - Click "Create a project"
   - Enter project name: `Disinformer`
   - Follow the setup wizard

## Step 2: Obtain Client-Side Keys (NEXT_PUBLIC_* variables)

These keys are public and safe to expose in client-side code.

1. In your Firebase project, click the gear icon (Settings) > **Project settings**
2. Under the "General" tab, scroll down to "Your apps"
3. Click **Add app** and select the web icon (</>) if it not already setup
4. Register your app with a nickname (e.g., "Disinformer")
5. Firebase will display a config object. Copy these values to your `.env` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Step 3: Obtain Server-Side Keys (FIREBASE_* variables)

These keys are private and should never be exposed publicly. They come from a service account key for server-side Firebase Admin SDK usage.

1. In the Firebase Console, go to **Project settings** > **Service accounts** tab
2. Click **Generate new private key**
3. This will download a JSON file (e.g., `serviceAccountKey.json`)
4. **Important:** Move this file to your project root and add it to `.gitignore` to prevent committing it
5. Open the downloaded JSON file and extract the following values:

```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_content\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_X509_CERT_URL=your_cert_url
```

**Note:** Keep the `FIREBASE_PRIVATE_KEY` exactly as it appears in the JSON file, including the quotes and `\n` for newlines.

## Step 4: Configure Your .env File

Create a `.env` file in your project root with all the variables:

```env
# Server side environment variables
FIREBASE_PROJECT_ID=disinformer-d40c6
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_content\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@disinformer-d40c6.iam.gserviceaccount.com
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40disinformer-d40c6.iam.gserviceaccount.com

# Client side environment variables
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=disinformer-d40c6.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=disinformer-d40c6
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=disinformer-d40c6.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Security Notes

- **Never commit** the `.env` file or `serviceAccountKey.json` to version control
- Add both files to your `.gitignore`:
  ```
  .env
  serviceAccountKey.json
  ```
- Rotate service account keys periodically for security
- Use Firebase's IAM (Identity and Access Management) to control access to your project

## Troubleshooting

- If you get permission errors, ensure you're logged into the correct Google account with access to the Firebase project
- For existing projects, contact the project owner for access or existing keys
- Refer to the [Firebase documentation](https://firebase.google.com/docs/web/setup) for additional setup guides

## Next Steps

After configuring your environment variables, you can run the application with:

```bash
npm install
npm run dev
```

For testing leaderboard operations, you may need to run the provided scripts:

```bash
npm run insert-test-players
npm run delete-test-players
```