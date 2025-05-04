import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "../api/firebase";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import { useNavigate } from "react-router-dom";


export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // Создать документ, если он не существует
      if (!userSnap.exists()) {
        // Если новый пользователь — создаем запись
        await setDoc(userRef, {
          email: user.email,
          userId: user.uid,
          achievements: [],
          completedExercises: [],
          lastActive: serverTimestamp(),
        });
      } else {
        // Если пользователь уже есть — обновим lastActive
        await updateDoc(userRef, {
          lastActive: serverTimestamp(),
        });
      }
      

      navigate("/dashboard");
    } catch (error) {
      console.error("Ошибка входа:", error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg"
      >
        Войти через Google
      </button>
    </div>
  );
}
