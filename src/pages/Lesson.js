import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, arrayUnion, updateDoc } from "firebase/firestore";
import { db, auth } from "../api/firebase";
import { useParams, useNavigate } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";
import ApiResponseViewer from "../components/ApiResponseViewer/ApiResponseViewer";
import Navbar from "../components/Navbar";
import { useProgress } from "../context/ProgressContext";
import { AnimatePresence } from 'framer-motion';
import { SuccessAnimation, ErrorAnimation, XpGainAnimation, LevelUpAnimation } from '../components/Animations';

export default function Lesson() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const {
    completedLessons,
    setCompletedLessons,
    level,
    xp,
    nextLevelXp,
    addXp,
    showXpGain,
    gainedXp,
    resetXp,
    XP_REWARDS,
    resetProgressForLesson,
    setXp,
    showLevelUp,
    levelUpAnimationKey
  } = useProgress();
  const [lesson, setLesson] = useState(null);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setLocalProgress] = useState([]);
  const [isResetting, setIsResetting] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const generateStudentId = () => {
    const userId = auth.currentUser?.uid || "guest";
    return `${userId.slice(0, 4)}`;
  };

  const [studentId, setStudentId] = useState(generateStudentId());

  const prepareCodeTemplate = (template) => {
    if (!template) return "";
    return template;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [lessonSnap, userSnap] = await Promise.all([
          getDoc(doc(db, "lessons", lessonId)),
          auth.currentUser
            ? getDoc(doc(db, "users", auth.currentUser.uid))
            : null,
        ]);

        if (!lessonSnap.exists()) {
          navigate("/lessons");
          return;
        }

        const lessonData = lessonSnap.data();
        setLesson(lessonData);
        setCode(
          prepareCodeTemplate(lessonData.exercises[0]?.codeTemplate || "")
        );

        if (userSnap?.exists()) {
          setLocalProgress(userSnap.data().completedExercises || []);
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

  const resetProgress = async () => {
    if (!auth.currentUser || !lesson) return;

    setIsResetting(true);
    try {
      // 1. Получаем текущий прогресс из Firestore
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (!userDoc.exists()) {
        setFeedback("Данные пользователя не найдены");
        return;
      }

      const userData = userDoc.data();
      const currentExercises = userData.completedExercises || [];

      // 2. Фильтруем упражнения этого урока
      const updatedExercises = currentExercises.filter(
        (item) => !item.lessonId.includes(lessonId)
      );

      // 3. Вычисляем сколько XP нужно вычесть
      const exercisesToRemove = currentExercises.filter(
        (item) => item.lessonId === lessonId
      );
      const xpToDeduct =
        exercisesToRemove.length * XP_REWARDS[lesson.difficulty];
      const newXp = Math.max(0, (userData.xp || 0) - xpToDeduct);

      // 4. Обновляем данные в Firestore
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        completedExercises: updatedExercises,
        xp: newXp,
      });

      // 5. Обновляем ВСЕ локальные состояния
      setLocalProgress(updatedExercises);
      setXp(newXp); // Важно: обновляем XP!
      setCompletedLessons((prev) => {
        const newSet = new Set(prev);
        newSet.delete(lessonId);
        return newSet;
      });

      setFeedback(`Прогресс сброшен! Вычтено ${xpToDeduct} XP`);
      setCode(
        prepareCodeTemplate(
          lesson.exercises[currentExercise]?.codeTemplate || ""
        )
      );
      setApiResponse(null);
      setApiError(null);
    } catch (error) {
      console.error("Ошибка сброса:", error);
      setFeedback("Ошибка при сбросе прогресса");
    } finally {
      setIsResetting(false);
    }
  };

  const runTests = async () => {
    if (!lesson) return;

    const exercise = lesson.exercises[currentExercise];
    if (!exercise?.tests) return;

    try {
      setIsApiLoading(true);
      setApiResponse(null);
      setApiError(null);
      setFeedback("");

      try {
        const userCodeResult = await new Function(code)();
        setApiResponse(userCodeResult);
      } catch (execError) {
        console.error("Ошибка выполнения:", execError);
        setApiError(execError);
      }

      const preparedTests = exercise.tests
        .map((t, i) => {
          const testWithCode = t.test
            .replace(/studentId=1/g, `studentId=${studentId}`)
            .replace(/studentId: 1/g, `studentId: '${studentId}'`)
            .replace(/code/g, JSON.stringify(code));

          return `
          try {
            __testResults.test${i} = await (async () => {
              const code = ${JSON.stringify(code)};
              ${testWithCode}
            })();
          } catch (e) {
            console.error('Ошибка в тесте:', e);
            __testResults.test${i} = false;
          }
        `;
        })
        .join("\n");

      const wrappedCode = `
        return (async () => {
          "use strict";
          let __testResults = {};
          try {
            ${code}
            ${preparedTests}
          } catch (e) {
            console.error('Ошибка выполнения:', e);
            throw e;
          }
          return __testResults;
        })()
      `;

      const testResults = await new Function(wrappedCode)();
      const failedTests = [];

      for (let i = 0; i < exercise.tests.length; i++) {
        if (testResults[`test${i}`] !== true) {
          failedTests.push(`❌ ${exercise.tests[i].description}`);
        }
      }

      if (failedTests.length > 0) {
  setFeedback(`Тесты не пройдены:\n${failedTests.join("\n")}`);
  setShowError(true);
} else {
  setFeedback("✅ Все тесты успешно пройдены!");
  setShowSuccess(true);
  await addXp(lesson.difficulty); // Переместили вызов addXp сюда
  await saveProgress();
}
    } catch (error) {
      console.error("Ошибка проверки:", error);
      setFeedback(`❌ Ошибка выполнения: ${error.message}`);
      setShowError(true);
      
    } finally {
      setIsApiLoading(false);
    }
  };

  const saveProgress = async () => {
    if (!auth.currentUser || !lesson) return;

    const exerciseId = `lesson-${lessonId}-ex-${currentExercise}`;
    if (progress.some((item) => item.exerciseId === exerciseId)) return;

    try {
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      completedExercises: arrayUnion({
        exerciseId,
        lessonId,
        completedAt: new Date(),
      })
    });

      // Обновляем локальное состояние
      const updatedProgress = [...progress, { exerciseId, lessonId }];
      setLocalProgress(updatedProgress);

      // Обновляем XP
      addXp(lesson.difficulty);

    // Проверка завершения урока
    const exercisesInLesson = updatedProgress.filter(
      (item) => item.lessonId === lessonId
    ).length;
    
    if (exercisesInLesson === lesson.exercises.length) {
      setCompletedLessons(prev => new Set([...prev, lessonId]));
    }
  } catch (error) {
    console.error("Ошибка сохранения:", error);
  }
};

  const goToExercise = (index) => {
    if (!lesson || index < 0 || index >= lesson.exercises.length) return;
    setCurrentExercise(index);
    setCode(prepareCodeTemplate(lesson.exercises[index]?.codeTemplate || ""));
    setFeedback("");
    setApiResponse(null);
    setApiError(null);
  };

  const completedExercises = progress.filter(
    (item) => item.lessonId === lessonId
  ).length;

  const totalExercises = lesson?.exercises?.length || 0;
  const isCompleted = progress.some(
    (item) => item.exerciseId === `lesson-${lessonId}-ex-${currentExercise}`
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Урок не найден</h1>
        <button
          onClick={() => navigate("/lessons")}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Вернуться к списку уроков
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <Navbar />
          <AnimatePresence>  
      {showSuccess && <SuccessAnimation/>}
      {showError && <ErrorAnimation />}
      {showXpGain && <XpGainAnimation amount={gainedXp} />}
      {showLevelUp && <LevelUpAnimation newLevel={level} key={`levelup-${levelUpAnimationKey}`} />}
    </AnimatePresence>
      <div className="max-w-4xl mx-auto p-4">
 

        {/* Индикатор прогресса */}
        <div className="fixed bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg z-50">
          <div className="text-center font-bold">Уровень {level}</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${Math.min(100, (xp / nextLevelXp) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-center mt-1">
            {xp}/{nextLevelXp} XP
          </div>
        </div>
        {/* Шапка урока */}
        <div className="mb-4 p-3 bg-white rounded-lg">
          <p className="text-sm text-blue-700">
            Ваш уникальный Student Id:{" "}
            <span className="font-mono font-bold">{studentId}</span>
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Этот ID используется для ваших данных в API
          </p>
        </div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            <p className="text-gray-600">{lesson.description}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              lesson.difficulty === "beginner"
                ? "bg-green-100 text-green-800"
                : lesson.difficulty === "intermediate"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {lesson.difficulty}
          </span>
        </div>

        {/* Теоретическая часть */}
        {lesson.theory && (
          <div className="mb-8 p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Теория</h2>
            <div className="prose max-w-none">
              {lesson.theory.split("\n").map((paragraph, i) => (
                <p key={i} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Блок упражнения */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-4   border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Упражнение {currentExercise + 1} из {totalExercises}
                {isCompleted && (
                  <span className="ml-2 text-green-500">✓ Выполнено</span>
                )}
              </h2>
              <div className="flex space-x-2">
                {/* <button
                onClick={clearUserData}
                disabled={isApiLoading}
                className="text-sm text-blue-500 hover:text-blue-700 disabled:opacity-50"
              >
                Очистить мои данные
              </button> */}
                <button
                  onClick={resetProgress}
                  disabled={isResetting || completedExercises === 0}
                  className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  {isResetting ? "Сбрасываем..." : "Сбросить прогресс"}
                </button>
              </div>
            </div>
            <p className="mt-2 text-primary">
              {lesson.exercises[currentExercise]?.instruction}
            </p>
          </div>

          <CodeEditor
            code={code}
            onChange={setCode}
            height="300px"
            options={{
              readOnly: isCompleted,
              minimap: { enabled: false },
            }}
          />

          <div className="p-4    border-t">
            <div className="space-y-4">
              <div
                className={`p-2 rounded bg-primary ${
                  feedback.includes("✅")
                    ? "bg-green-100 text-green-800"
                    : feedback.includes("❌")
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100"
                }`}
              >
                {feedback || "Запустите код для проверки"}
              </div>

              <ApiResponseViewer
                response={apiResponse}
                error={apiError}
                isLoading={isApiLoading}
              />

              <button
                onClick={runTests}
                disabled={isCompleted || isApiLoading}
                className={`px-4 py-2 rounded bg-primary  ${
                  isCompleted || isApiLoading
                    ? "bg-gray-400"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {isApiLoading ? "Выполняем..." : "Выполнить"}
              </button>
            </div>
          </div>
        </div>

        {/* Навигация по упражнениям */}
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
              onClick={() => navigate("/lessons")}
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
            <span>
              {completedExercises} / {totalExercises}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${
                  totalExercises > 0
                    ? (completedExercises / totalExercises) * 100
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
