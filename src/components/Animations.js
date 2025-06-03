import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';

export const SuccessAnimation = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <>
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        recycle={false}
        numberOfPieces={300}
        gravity={0.15}
      />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', damping: 10, stiffness: 100 }}
        className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
      >
        <motion.div
          className="text-6xl text-green-500 font-bold"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: 0.8,
            repeat: 2,
            repeatType: 'reverse'
          }}
        >
          ✓
        </motion.div>
      </motion.div>
    </>
  );
};

export const ErrorAnimation = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        backgroundColor: ['rgba(255,255,255,0)', 'rgba(255,200,200,1)', 'rgba(255,255,255,0)']
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
};

export const LevelUpAnimation = ({ newLevel }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ 
          scale: 1,
          rotate: [0, 5, -5, 0],
        }}
        transition={{ 
          type: 'spring',
          stiffness: 100,
          damping: 10
        }}
        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-4xl font-bold p-8 rounded-lg shadow-lg"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            y: [0, -10, 0]
          }}
          transition={{ 
            duration: 0.5,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        >
          LEVEL UP! 🎉
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl mt-4"
        >
          Новый уровень: {newLevel}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export const XpGainAnimation = ({ amount }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: [1, 0], y: -100 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-blue-500 z-50 pointer-events-none"
    >
      +{amount} XP
    </motion.div>
  );
};