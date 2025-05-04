import { collection, getDocs } from 'firebase/firestore';
import { db } from '../api/firebase';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function LessonsList() {
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    const fetchLessons = async () => {
      const querySnapshot = await getDocs(collection(db, 'lessons'));
      const lessonsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLessons(lessonsData.sort((a, b) => a.order - b.order));
    };
    fetchLessons();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 pt-6">
        <h1 className="text-2xl font-bold mb-6">Уроки JavaScript</h1>
        <div className="grid gap-4">
          {lessons.map(lesson => (
            <Link 
              to={`/lessons/${lesson.id}`}
              key={lesson.id}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors bg-white"
            >
              <h2 className="text-xl font-semibold">{lesson.title}</h2>
              <p className="text-gray-600">{lesson.description}</p>
              <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {lesson.difficulty}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}