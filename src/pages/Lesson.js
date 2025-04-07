import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, arrayUnion, updateDoc } from 'firebase/firestore';
import { db, auth } from '../api/firebase';
import { useParams, useNavigate } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';

export default function Lesson() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState([]);
  const [isResetting, setIsResetting] = useState(false);

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      try {
        const [lessonSnap, userSnap] = await Promise.all([
          getDoc(doc(db, 'lessons', lessonId)),
          auth.currentUser ? getDoc(doc(db, 'users', auth.currentUser.uid)) : null
        ]);

        if (!lessonSnap.exists()) {
          navigate('/lessons');
          return;
        }

        setLesson(lessonSnap.data());
        setCode(lessonSnap.data().exercises[0]?.codeTemplate || '');

        if (userSnap?.exists()) {
          setProgress(userSnap.data().completedExercises || []);
        }

      } catch (error) {
        console.error("Ошибка загрузки:", error);
        setFeedback("Ошибка загрузки урока");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [lessonId, navigate]);

  // Сброс прогресса
  const resetProgress = async () => {
    if (!auth.currentUser || !lesson) return;
    
    setIsResetting(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        completedExercises: progress.filter(
          item => !item.lessonId.includes(lessonId)
        )
      });
      setProgress(prev => prev.filter(item => !item.lessonId.includes(lessonId)));
      setFeedback('Прогресс сброшен. Можно начать заново!');
      setCode(lesson.exercises[currentExercise]?.codeTemplate || '');
    } catch (error) {
      console.error("Ошибка сброса:", error);
      setFeedback('Ошибка при сбросе прогресса');
    } finally {
      setIsResetting(false);
    }
  };

  // Проверка задания
  const runTests = async () => {
    try {
      const normalizedCode = code.replace(/\s+/g, '');
      const validSolutions = [
        'constx=5;', 'letx=5;', 'varx=5;',
        'constx=5', 'letx=5', 'varx=5'
      ];

      if (!validSolutions.includes(normalizedCode)) {
        throw new Error('Используйте точный синтаксис: const x = 5;');
      }

      setFeedback('✅ Верно! Задание выполнено');
      await saveProgress();

    } catch (error) {
      setFeedback(`❌ ${error.message}`);
    }
  };

  // Сохранение прогресса
  const saveProgress = async () => {
    if (!auth.currentUser || !lesson) return;

    const exerciseId = `lesson-${lessonId}-ex-${currentExercise}`;
    if (progress.some(item => item.exerciseId === exerciseId)) return;

    try {
      await setDoc(
        doc(db, 'users', auth.currentUser.uid),
        {
          completedExercises: arrayUnion({
            exerciseId,
            lessonId,
            completedAt: new Date()
          })
        },
        { merge: true }
      );
      setProgress(prev => [...prev, { exerciseId, lessonId }]);
    } catch (error) {
      console.error("Ошибка сохранения:", error);
    }
  };

  // Навигация по упражнениям
  const goToExercise = (index) => {
    if (!lesson || index < 0 || index >= lesson.exercises.length) return;
    setCurrentExercise(index);
    setCode(lesson.exercises[index].codeTemplate || '');
    setFeedback('');
  };

  // Вычисление прогресса
  const completedExercises = progress.filter(
    item => item.lessonId === lessonId
  ).length;

  const totalExercises = lesson?.exercises?.length || 0;
  const isCompleted = progress.some(
    item => item.exerciseId === `lesson-${lessonId}-ex-${currentExercise}`
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!lesson) {
    return <div className="max-w-4xl mx-auto p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Урок не найден</h1>
      <button 
        onClick={() => navigate('/lessons')} 
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Вернуться к списку уроков
      </button>
    </div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Шапка урока */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
          <p className="text-gray-600">{lesson.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${
          lesson.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
          lesson.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {lesson.difficulty}
        </span>
      </div>

      {/* Блок упражнения */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Упражнение {currentExercise + 1} из {totalExercises}
              {isCompleted && <span className="ml-2 text-green-500">✓ Выполнено</span>}
            </h2>
            <button 
              onClick={resetProgress}
              disabled={isResetting || completedExercises === 0}
              className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              {isResetting ? 'Сбрасываем...' : 'Сбросить прогресс'}
            </button>
          </div>
          <p className="mt-2 text-gray-700">{lesson.exercises[currentExercise]?.instruction}</p>
        </div>

        <CodeEditor 
          code={code} 
          onChange={setCode} 
          height="300px"
          options={{
            readOnly: isCompleted,
            minimap: { enabled: false }
          }}
        />

        <div className="p-4 bg-gray-50 border-t">
          <div className="flex justify-between items-center">
            <div className={`p-2 rounded ${
              feedback.includes('✅') ? 'bg-green-100 text-green-800' :
              feedback.includes('❌') ? 'bg-red-100 text-red-800' : 'bg-gray-100'
            }`}>
              {feedback || 'Запустите код для проверки'}
            </div>
            <button
              onClick={runTests}
              disabled={isCompleted}
              className={`px-4 py-2 rounded text-white ${
                isCompleted ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              Проверить код
            </button>
          </div>
        </div>
      </div>

      {/* Навигация */}
      <div className="flex justify-between mb-6">
        <button
          onClick={() => goToExercise(currentExercise - 1)}
          disabled={currentExercise === 0}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Назад
        </button>
        {currentExercise < totalExercises - 1 ? (
          <button
            onClick={() => goToExercise(currentExercise + 1)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Следующее задание
          </button>
        ) : (
          <button
            onClick={() => navigate('/lessons')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Вернуться к списку уроков
          </button>
        )}
      </div>

      {/* Прогресс-бар */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span>Прогресс урока:</span>
          <span>{completedExercises} / {totalExercises}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{
              width: `${totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0}%`
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}