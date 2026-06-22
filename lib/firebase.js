import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApp()
}

export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = typeof window !== 'undefined' ? getAuth(app) : null

// On the client, ensure anonymous sign-in so we can identify users for quotas
export async function ensureAnonymousSignIn() {
  if (!auth) return null
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe()
      if (user) return resolve(user)
      try {
        const cred = await signInAnonymously(auth)
        resolve(cred.user)
      } catch (err) {
        reject(err)
      }
    })
  })
}
