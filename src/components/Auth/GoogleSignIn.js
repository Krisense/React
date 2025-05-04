import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../api/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import googleIcon from "../assets/google.svg"; // Убедитесь, что путь верный

export default function GoogleSignIn() {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // Если пользователь еще не существует в Firestore, создаем запись
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          uid: user.uid,
          achievements: [],
          completedExercises: [],
          lastActive: serverTimestamp(),
        });
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Ошибка входа через Google:", error);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="flex items-center justify-center border px-4 py-2 rounded w-full hover:bg-gray-50 transition"
    >
      <img src={googleIcon} alt="Google" className="w-5 h-5 mr-2" />
      Войти через Google
    </button>
  );
}
