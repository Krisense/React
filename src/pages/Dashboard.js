import { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../api/firebase';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useProgress } from '../context/ProgressContext';

export default function Dashboard() {
  const [userProgress, setUserProgress] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { level, xp, nextLevelXp } = useProgress();

  useEffect(() => {
    const fetchProgress = async () => {
      if (!auth.currentUser) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        
        if (!userDoc.exists()) {
          throw new Error('Данные пользователя не найдены');
        }

        const userData = userDoc.data();
        const exercises = userData.completedExercises || [];
        const exercisesArray = Array.isArray(exercises) ? exercises : Object.values(exercises);
        
        setUserProgress(exercisesArray);

        const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
        const lessonsData = lessonsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLessons(lessonsData);
        setTotalLessons(lessonsData.length);

      } catch (err) {
        console.error('Ошибка загрузки:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [navigate]);

  useEffect(() => {
    if (userProgress.length === 0 || lessons.length === 0) {
      setCompletedCount(0);
      return;
    }

    const fullyCompletedLessons = lessons.filter(lesson => {
      const completedExercises = userProgress.filter(
        item => item.lessonId === lesson.id
      ).length;
      return completedExercises === (lesson.exercises?.length || 0);
    }).length;

    setCompletedCount(fullyCompletedLessons);
  }, [userProgress, lessons]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (err) {
      console.error('Ошибка выхода:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-red-100 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-2 text-red-800">Ошибка</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primaryback">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 pt-4">
     {/* Панель прогресса */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex justify-between mb-2">
            <span className="font-bold">Уровень {level}</span>
            <span>{xp}/{nextLevelXp} XP</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full" 
              style={{ width: `${Math.min(100, (xp / nextLevelXp) * 100)}%` }}
            />
          </div>
        </div>


        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Личный кабинет</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/lessons')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              Перейти к урокам
            </button>
            <button 
              onClick={() => navigate('/shop')}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
            >
              Магазин
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Выйти
            </button>
          </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Карточка прогресса */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Прогресс обучения</h3>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-4 mr-4">
                <div 
                  className="bg-blue-500 h-4 rounded-full" 
                  style={{ 
                    width: `${totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0}%`
                  }}
                ></div>
              </div>
              <span>{completedCount}/{totalLessons}</span>
            </div>
          </div>

          {/* Карточка достижений */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Достижения</h3>
            <div className="space-y-2">
              {completedCount > 0 && (
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Первый урок пройден!</span>
                </div>
              )}
              {completedCount >= 5 && (
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>5 уроков завершено</span>
                </div>
              )}
              {userProgress.length >= 10 && (
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>10 заданий выполнено</span>
                </div>
              )}
              {level >= 3 && (
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Достигнут уровень 3</span>
                </div>
              )}
            </div>
          </div>

          {/* Карточка статистики */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Статистика</h3>
            <p>Уроков завершено: {completedCount}</p>
            <p>Заданий выполнено: {userProgress.length}</p>
            <p>Текущий уровень: {level}</p>
          </div>
        </div>

        {/* Список уроков с прогрессом */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Мои уроки</h2>
          <LessonProgressList 
            userProgress={userProgress} 
            lessons={lessons}
            onLessonSelect={(lessonId) => navigate(`/lessons/${lessonId}`)}
          />
        </section>
      </div>
    </div>
  );
}

function LessonProgressList({ userProgress, lessons, onLessonSelect }) {
  const getLessonProgress = (lessonId) => {
    return userProgress.filter(item => item.lessonId === lessonId).length;
  };

  return (
    <div className="space-y-4">
      {lessons.map(lesson => {
        const completedExercises = getLessonProgress(lesson.id);
        const totalExercises = lesson.exercises?.length || 0;
        const progressPercent = totalExercises > 0 
          ? (completedExercises / totalExercises) * 100 
          : 0;
        
        return (
          <div 
            key={lesson.id} 
            className="p-4 border rounded-lg hover:bg-blue-50 cursor-pointer transition"
            onClick={() => onLessonSelect(lesson.id)}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">{lesson.title || `Урок ${lesson.id}`}</h3>
              <span className="text-sm text-gray-500">
                {completedExercises}/{totalExercises}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}