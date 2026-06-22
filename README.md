# Drive for guest photos

This project is a minimal Next.js starter to let guests upload photos from their phones and view others' uploads in real time using Firebase (Storage + Firestore) and Tailwind CSS.

Quick start

1. Install dependencies
   npm install

2. Create a Firebase project
   - Enable Firestore (in Native mode) and Storage
   - Create a Web app and copy the config

3. Create a .env.local file at the repo root with these variables from your Firebase app:

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_UPLOAD_URL=

NEXT_PUBLIC_UPLOAD_URL should point to the Cloud Function endpoint that will process uploads (e.g. https://us-central1-YOUR_PROJECT.cloudfunctions.net/app/upload)

4. Run the dev server
   npm run dev

What I added
- package.json (Next.js, React, Firebase, Tailwind, etc.)
- .gitignore
- Tailwind + PostCSS config
- pages/_app.jsx, pages/index.jsx, pages/upload.jsx
- lib/firebase.js to initialize Firebase using env vars and ensure anonymous sign-in
- styles/globals.css
- functions/ (Cloud Function handling uploads with quotas)
- firebase.rules (example Firestore + Storage rules)

Cloud Function & quotas
- The functions/ directory contains an Express handler that:
  - Verifies the client's Firebase ID token (so the client must sign in anonymously first)
  - Enforces quotas per IP and per uploader (hour/day)
  - Validates file size/type and uploads the image to Storage using the Admin SDK
  - Creates a Firestore document in `photos` with metadata

Security notes
- Firestore/Storage rules are set to deny direct client writes to `photos`/`photos/*`. Uploads should go through the trusted Cloud Function.
- The function currently makes uploaded files public (file.makePublic()). If you prefer private objects, change the function to generate signed URLs instead.
- Cloud Functions see the client's IP (via X-Forwarded-For) to enforce IP quotas.

Deploying the Cloud Function
1. Install Firebase CLI and log in:
   npm install -g firebase-tools
   firebase login
2. In your Firebase project directory, initialize functions (if not already):
   firebase init functions
   - choose JavaScript, and when prompted, you can copy the provided functions/* into the functions/ directory
3. Deploy functions only:
   firebase deploy --only functions

Note: if you use the provided functions code directly, ensure you set the function's entry point as `app` (the example uses `exports.app = app`). The deployment URL will be like `https://<region>-<project>.cloudfunctions.net/app/upload`.

Costs & billing
- Enforcing quotas and running functions is free for light use, but Cloud Functions and Storage may incur costs at scale. Enable billing if you anticipate higher traffic.

If tu veux, je peux aussi:
- Ajouter des tests ou une CI pour valider les règles
- Mettre en place un système de modération (approuver avant publication)
- Implementer signed URLs instead of makePublic()
