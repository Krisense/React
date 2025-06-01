import { Link } from 'react-router-dom';
import { auth } from '../api/firebase';
import { useEffect } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../api/firebase';
import { useProgress } from '../context/ProgressContext';

export default function Navbar() {
  const { completedLessons, totalLessons, setCompletedLessons, setTotalLessons } = useProgress();

  useEffect(() => {
    const fetchProgress = async () => {
      if (!auth.currentUser) return;
      
      try {
        // Получаем данные пользователя
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const exercises = userData.completedExercises || [];
          const exercisesArray = Array.isArray(exercises) ? exercises : Object.values(exercises);
          
          // Получаем уникальные завершенные уроки (где выполнены ВСЕ задания)
          const lessonsWithAllExercises = await getCompletedLessons(exercisesArray);
          setCompletedLessons(new Set(lessonsWithAllExercises));
        }

        // Получаем общее количество уроков
        const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
        setTotalLessons(lessonsSnapshot.size);
      } catch (error) {
        console.error("Ошибка загрузки прогресса:", error);
      }
    };

    const getCompletedLessons = async (completedExercises) => {
      const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
      const completedLessons = [];
      
      lessonsSnapshot.forEach(lessonDoc => {
        const lessonId = lessonDoc.id;
        const lessonExercises = lessonDoc.data().exercises || [];
        const completedExercisesForLesson = completedExercises.filter(
          ex => ex.lessonId === lessonId
        );
        
        if (completedExercisesForLesson.length === lessonExercises.length) {
          completedLessons.push(lessonId);
        }
      });
      
      return completedLessons;
    };

    fetchProgress();
  }, [setCompletedLessons, setTotalLessons]);

  return (
    <nav className="bg-white shadow-sm py-3 px-6 flex items-center justify-between sticky top-0 z-50">
      <Link 
        to="/" 
        className="flex items-center text-xl font-semibold text-gray-800 hover:text-blue-600 transition"
      >
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        JS Learner
      </Link>

      <div className="flex items-center space-x-4">
        {auth.currentUser && (
          <div className="flex items-center">
            <div className="relative w-32 mr-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${totalLessons > 0 ? (completedLessons.size / totalLessons) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 absolute -bottom-5 left-0">
                {completedLessons.size}/{totalLessons} уроков
              </span>
            </div>

            <Link
              to="/dashboard"
              className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium text-blue-600">Кабинет</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}