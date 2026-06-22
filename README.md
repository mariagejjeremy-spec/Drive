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

4. Run the dev server
   npm run dev

What I added
- package.json (dependencies)
- .gitignore
- Tailwind + PostCSS config
- pages/_app.jsx, pages/index.jsx, pages/upload.jsx
- lib/firebase.js to initialize Firebase using env vars
- styles/globals.css with Tailwind directives

Next steps / suggestions
- Set Firestore and Storage security rules appropriate for your use case (anonymous uploads, authenticated users, limits on file size/type).
- Optionally enable Firebase Authentication (anonymous or email) to track uploaders.
- Deploy to Vercel or Firebase Hosting.

If tu veux que je configure des règles d'exemple ou active l'auth, dis‑le et je les ajoute.