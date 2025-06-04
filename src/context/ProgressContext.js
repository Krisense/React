import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../api/firebase';
import { collection, getDocs } from 'firebase/firestore';

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
  
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showXpGain, setShowXpGain] = useState(false);
  const [gainedXp, setGainedXp] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const levelUpShown = useRef(false);

  const calculateLevelFromXp = (currentXp) => {
    for (let i = XP_REQUIREMENTS.length - 1; i >= 0; i--) {
      if (currentXp >= XP_REQUIREMENTS[i]) {
        return i + 1;
      }
    }
    return 1;
  };

  const loadLessons = async () => {
    const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
    const lessonsData = lessonsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setLessonsCache(lessonsData);
  };

 const resetProgressForLesson = async (lessonId) => {
    if (!auth.currentUser) return;

    setIsLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const currentExercises = userData.completedExercises || [];
      
      // Фильтруем только упражнения текущего урока
      const updatedExercises = currentExercises.filter(
        (item) => !item.lessonId.includes(lessonId)
      );

      // Вычисляем XP для вычета только для текущего урока
      const exercisesToRemove = currentExercises.filter(
        (item) => item.lessonId === lessonId
      );
      
      const xpToDeduct = exercisesToRemove.reduce((sum, item) => {
        const lesson = lessonsCache.find(l => l.id === item.lessonId);
        return sum + (lesson ? XP_REWARDS[lesson.difficulty] : 0);
      }, 0);

      const newXp = Math.max(0, (userData.xp || 0) - xpToDeduct);
      const newLevel = calculateLevelFromXp(newXp);

      // Атомарное обновление состояний
      setUserProgress(updatedExercises);
      setXp(newXp);
      setLevel(newLevel);
      setNextLevelXp(XP_REQUIREMENTS[newLevel] || XP_REQUIREMENTS[XP_REQUIREMENTS.length - 1]);
      levelUpShown.current = false;

      // Обновляем completedLessons
      setCompletedLessons(prev => {
        const newSet = new Set(prev);
        newSet.delete(lessonId);
        return newSet;
      });

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        completedExercises: updatedExercises,
        xp: newXp
      });

      return true;
    } catch (error) {
      console.error("Ошибка сброса прогресса:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

const addXp = async (difficulty) => {
    if (!auth.currentUser) return;
    
    const xpGain = XP_REWARDS[difficulty];
    const newXp = xp + xpGain;
    const currentLevel = level;
    const newLevel = calculateLevelFromXp(newXp);

    setXp(newXp);
    setGainedXp(xpGain);
    setShowXpGain(true);

    if (newLevel > currentLevel && !levelUpShown.current) {
      setLevel(newLevel);
      setNextLevelXp(XP_REQUIREMENTS[newLevel] || XP_REQUIREMENTS[XP_REQUIREMENTS.length - 1]);
      setShowLevelUp(true);
      levelUpShown.current = true;
    }

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        xp: newXp
      });
    } catch (error) {
      console.error("Ошибка сохранения XP:", error);
      setXp(xp);
      setLevel(currentLevel);
    }
  };

  useEffect(() => {
    let timer;
    if (showXpGain) {
      timer = setTimeout(() => setShowXpGain(false), 1500);
    }
    return () => clearTimeout(timer);
  }, [showXpGain]);

  useEffect(() => {
    let timer;
    if (showLevelUp) {
      timer = setTimeout(() => setShowLevelUp(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [showLevelUp]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const [userDoc, lessonsSnapshot] = await Promise.all([
            getDoc(doc(db, 'users', user.uid)),
            getDocs(collection(db, 'lessons'))
          ]);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const exercises = userData.completedExercises || [];
            const xpFromDB = userData.xp || 0;
            const currentLevel = calculateLevelFromXp(xpFromDB);
            
            setXp(xpFromDB);
            setLevel(currentLevel);
            setNextLevelXp(XP_REQUIREMENTS[currentLevel] || XP_REQUIREMENTS[XP_REQUIREMENTS.length - 1]);
            setUserProgress(exercises);
            setTotalLessons(lessonsSnapshot.size);
          }
        } catch (error) {
          console.error("Ошибка загрузки прогресса:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setXp(0);
        setLevel(1);
        setUserProgress([]);
        setIsLoading(false);
      }
    });

    loadLessons();
    return () => unsubscribe();
  }, []);

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
    showLevelUp,
    showXpGain,
    gainedXp,
    setXp,
  };

return (
    <ProgressContext.Provider value={{
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
      showLevelUp,
      showXpGain,
      gainedXp,
      showSuccess,
      setShowSuccess,
      setXp
    }}>
      {!isLoading && children}
    </ProgressContext.Provider>
  );
}

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};