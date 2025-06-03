import { Link } from 'react-router-dom';
import { auth } from '../api/firebase';
import { useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../api/firebase';
import { useProgress } from '../context/ProgressContext';

export default function Navbar() {
  const { level, xp, nextLevelXp, completedLessons, totalLessons } = useProgress();

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
          <div className="flex items-center space-x-4">
            <div className="progress-container">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Ур. {level}</span>
                <span>{completedLessons.size}/{totalLessons}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${totalLessons > 0 ? (completedLessons.size / totalLessons) * 100 : 0}%` }}
                />
              </div>
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