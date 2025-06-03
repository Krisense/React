import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { auth } from "./api/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login"; // Создайте этот компонент
import Dashboard from "./pages/Dashboard"; // Создайте этот компонент
import Lesson from "./pages/Lesson";
import LessonsList from "./pages/LessonsList";
import Shop from "./pages/Shop";
import { AuthProvider } from "./context/AuthContext";
import { ProgressProvider } from "./context/ProgressContext";

function App() {
  const [user, setUser] = useState(null);
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAppLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (appLoading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <AuthProvider>
      <ProgressProvider>
    <Router>
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/lessons" element={<LessonsList />} />
        <Route path="/lessons/:lessonId" element={<Lesson />} /> 
        {/* Защищенные маршруты */}
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/" />} 
        />
        <Route 
        path="/shop" 
        element={user ? <Shop /> : <Navigate to="/" />} 
        />
        {/* Другие маршруты */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
    </ProgressProvider>
    </AuthProvider>
  );
}

export default App;
