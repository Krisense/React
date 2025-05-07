import { useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../api/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const navigate = useNavigate();

  // Отслеживаем состояние авторизации
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        fetchUserProgress(user.uid);
      }
    });
    return unsubscribe;
  }, []);

  const fetchUserProgress = async (userId) => {
    try {
      // Получаем прогресс пользователя
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const exercises = userData.completedExercises || [];
        const exercisesArray = Array.isArray(exercises) ? exercises : Object.values(exercises);
        
        // Считаем уникальные пройденные уроки
        const uniqueLessons = new Set(exercisesArray.map(item => item.lessonId)).size;
        setProgress(uniqueLessons);
      }

      // Получаем общее количество уроков
      const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
      setTotalLessons(lessonsSnapshot.size);
    } catch (err) {
      console.error("Ошибка загрузки прогресса:", err);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Проверяем, есть ли пользователь в Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          achievements: [],
          completedExercises: [],
          lastActive: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      }

      // Обновляем данные после авторизации
      setUser(user);
      await fetchUserProgress(user.uid);
      
    } catch (err) {
      console.error("Ошибка авторизации:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Передаем данные пользователя и прогресс в Navbar */}
      <Navbar user={user} progress={progress} totalLessons={totalLessons} />
      
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            {user ? `Добро пожаловать, ${user.displayName || 'пользователь'}!` : 'Добро пожаловать!'}
          </h1>
          
          <p className="text-gray-600 mb-8">
            {user 
              ? 'Продолжайте изучать JavaScript и улучшайте свои навыки!'
              : 'Войдите, чтобы начать изучать JavaScript с интерактивными уроками.'
            }
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {!user ? (
            <>
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition ${
                  loading ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {loading ? (
                  <>
                    <span className="animate-spin">↻</span>
                    Вход...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Войти через Google
                  </>
                )}
              </button>

              {/* <div className="mt-6 text-sm text-gray-500">
                Нажимая кнопку, вы соглашаетесь с нашими Условиями использования и Политикой конфиденциальности
              </div> */}
            </>
          ) : (
            <div className="space-y-4">
              {/* <button
                onClick={() => navigate('/lessons')}
                className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition"
              >
                Перейти к урокам
              </button> */}
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
              >
                Личный кабинет
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}