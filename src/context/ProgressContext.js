import { createContext, useContext, useState } from 'react';

const ProgressContext = createContext();

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(new Set());

  return (
    <ProgressContext.Provider value={{ 
      progress, 
      totalLessons, 
      completedLessons,
      setProgress, 
      setTotalLessons,
      setCompletedLessons
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export const useProgress = () => useContext(ProgressContext);