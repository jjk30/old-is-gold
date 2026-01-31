import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCaxUJKgguMEaE5LNBaxYA8cEAnUl75Eqo",
  authDomain: "old-is-gold-be8c8.firebaseapp.com",
  projectId: "old-is-gold-be8c8",
  storageBucket: "old-is-gold-be8c8.firebasestorage.app",
  messagingSenderId: "410951436374",
  appId: "1:410951436374:web:bfb85d1cc68e7eb5d213f7",
  measurementId: "G-D5FQ4PL75T"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export default app
