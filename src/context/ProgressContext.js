import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../api/firebase';
import { collection } from 'firebase/firestore';
import { getDocs } from 'firebase/firestore';

const XP_REQUIREMENTS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
const XP_REWARDS = {
  beginner: 50,
  intermediate: 100,
  advanced: 200
};

const ProgressContext = createContext();

export function ProgressProvider({ children }) {
  const [userProgress, setUserProgress] = useState([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [nextLevelXp, setNextLevelXp] = useState(XP_REQUIREMENTS[1]);
  const [isLoading, setIsLoading] = useState(true);
  const [lessonsCache, setLessonsCache] = useState([]);
  
  // Функция для расчета уровня на основе XP
  const calculateLevel = (currentXp) => {
    let newLevel = 1;
    for (let i = XP_REQUIREMENTS.length - 1; i >= 0; i--) {
      if (currentXp >= XP_REQUIREMENTS[i]) {
        newLevel = i + 1;
        break;
      }
    }
    setLevel(newLevel);
    setNextLevelXp(XP_REQUIREMENTS[newLevel] || XP_REQUIREMENTS[XP_REQUIREMENTS.length - 1]);
  };

  const resetProgressForLesson = async (lessonId) => {
  if (!auth.currentUser) return;

  setIsLoading(true);
  try {
    // 1. Получаем текущие данные пользователя
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const currentExercises = userData.completedExercises || [];
    
    // 2. Фильтруем упражнения для этого урока
    const updatedExercises = currentExercises.filter(
      (item) => !item.lessonId.includes(lessonId)
    );

    // 3. Вычисляем XP для вычета
    const exercisesToRemove = currentExercises.filter(
      (item) => item.lessonId === lessonId
    );
    const xpToDeduct = exercisesToRemove.reduce((sum, item) => {
      const lesson = lessonsCache.find(l => l.id === item.lessonId);
      return sum + (lesson ? XP_REWARDS[lesson.difficulty] : 0);
    }, 0);

    // 4. Обновляем данные в Firestore
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      completedExercises: updatedExercises,
      xp: userData.xp ? Math.max(0, userData.xp - xpToDeduct) : 0
    });

    // 5. Обновляем локальное состояние
    setUserProgress(updatedExercises);
    setXp(prev => Math.max(0, prev - xpToDeduct));
    calculateLevel(Math.max(0, (userData.xp || 0) - xpToDeduct));

    return true; // Успешный сброс
  } catch (error) {
    console.error("Ошибка сброса прогресса:", error);
    return false;
  } finally {
    setIsLoading(false);
  }
};

// При загрузке уроков
const loadLessons = async () => {
  const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
  const lessonsData = lessonsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  setLessonsCache(lessonsData);
};
  // Загрузка прогресса при инициализации или изменении пользователя
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const exercises = userData.completedExercises || [];
            const xpFromDB = userData.xp || 0;
            
            setXp(xpFromDB);
            calculateLevel(xpFromDB);
            setUserProgress(exercises);
            
            // Загружаем общее количество уроков
            const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
            setTotalLessons(lessonsSnapshot.size);
          }
        } catch (error) {
          console.error("Ошибка загрузки прогресса:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Сброс для неавторизованных пользователей
        setXp(0);
        setLevel(1);
        setUserProgress([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const addXp = async (difficulty) => {
    if (!auth.currentUser) return;
    
    const xpGain = XP_REWARDS[difficulty];
    const newXp = xp + xpGain;
    
    setXp(newXp);
    calculateLevel(newXp);
    
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        xp: newXp
      });
    } catch (error) {
      console.error("Ошибка сохранения XP:", error);
      // Откатываем изменения при ошибке
      setXp(xp);
      calculateLevel(xp);
    }
  };

  const value = {
    level,
    xp,
    nextLevelXp,
    addXp,
    userProgress,
    totalLessons,
    completedLessons,
    isLoading,
    XP_REWARDS,
    resetProgressForLesson,
    setXp
  };

  return (
    <ProgressContext.Provider value={value}>
      {!isLoading && children}
    </ProgressContext.Provider>
  );
}

export const useProgress = () => useContext(ProgressContext);