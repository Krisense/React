import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { auth } from "./api/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login"; // Создайте этот компонент
import Dashboard from "./pages/Dashboard"; // Создайте этот компонент

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Проверяем состояние авторизации при загрузке
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Загрузка...</div>; // Или красивый лоадер
  }

  return (
    <Router>
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Защищенные маршруты */}
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/login" />} 
        />

        {/* Другие маршруты */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
