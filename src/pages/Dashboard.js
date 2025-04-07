import { signOut } from "firebase/auth";
import { auth } from "../api/firebase";

export default function Dashboard() {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Личный кабинет</h1>
      <button 
        onClick={handleLogout}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Выйти
      </button>
    </div>
  );
}