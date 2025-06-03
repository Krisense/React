import React, { useEffect } from 'react';
import Confetti from 'react-confetti';
import { motion } from 'framer-motion';

export const SuccessAnimation = () => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
        />
      )}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl text-green-500 font-bold"
      >
        ✓
      </motion.div>
    </>
  );
};

export const ErrorAnimation = () => {
  return (
    <motion.div
      initial={{ x: 0 }}
      animate={{ 
        x: [-10, 10, -10, 10, 0],
        backgroundColor: ['rgba(255,255,255,1)', 'rgba(255,200,200,1)', 'rgba(255,255,255,1)']
      }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-red-100 bg-opacity-50"
    />
  );
};

export const LevelUpAnimation = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-4xl font-bold p-8 rounded-lg shadow-lg"
      >
        LEVEL UP! 🎉
      </motion.div>
    </div>
  );
};