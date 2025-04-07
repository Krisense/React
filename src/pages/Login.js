import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../api/firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard");
    } catch (error) {
      console.error("Ошибка входа:", error);
    }
    navigate("/dashboard"); // Редирект после успешного входа
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