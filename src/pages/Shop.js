import { useState, useEffect } from "react";
import { useProgress } from "../context/ProgressContext";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";

const SHOP_ITEMS = [
  {
    id: 1,
    name: "Темный редактор",
    description: "Темная тема для редактора кода",
    price: 200,
    unlockLevel: 3,
    theme: "dark",
  },
  {
    id: 2,
    name: "Ретро стиль",
    description: "Винтажный вид интерфейса",
    price: 500,
    unlockLevel: 5,
    theme: "retro",
  },
  {
    id: 3,
    name: "Контрастный режим",
    description: "Яркие цвета для лучшей читаемости",
    price: 300,
    unlockLevel: 4,
    theme: "high-contrast",
  },
];

export default function Shop() {
  const { level, xp } = useProgress();
  const [activeTheme, setActiveTheme] = useState(null);

  // Применение темы с обновлением DOM
  const applyTheme = (theme) => {
    // Анимация изменения темы
    document.documentElement.style.transition = "all 0.3s ease";

    // Удаляем все классы тем
    document.documentElement.className = "";

    // Добавляем выбранную тему
    if (theme) {
      document.documentElement.classList.add(`theme-${theme}`);
    }

    setActiveTheme(theme);
    localStorage.setItem("selectedTheme", theme);

    // Принудительно обновляем редактор кода
    const event = new Event("themeChanged");
    window.dispatchEvent(event);
  };

  // Загрузка сохраненной темы
  useEffect(() => {
    const savedTheme = localStorage.getItem("selectedTheme");
    if (savedTheme) {
      setActiveTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Магазин внешнего вида</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SHOP_ITEMS.map((item) => (
            <div
              key={item.id}
              className={`border rounded-lg p-4 ${
                level < item.unlockLevel ? "opacity-50" : ""
              }`}
            >
              <h3 className="text-xl font-semibold">{item.name}</h3>
              <p className="text-gray-600 mb-2">{item.description}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-yellow-600 font-bold">
                  {item.price} XP
                </span>
                {level >= item.unlockLevel ? (
                  <motion.button
                    onClick={() => applyTheme(item.theme)}
                    disabled={xp < item.price || activeTheme === item.theme}
                    whileHover={
                      xp >= item.price && activeTheme !== item.theme
                        ? { scale: 1.05 }
                        : {}
                    }
                    whileTap={
                      xp >= item.price && activeTheme !== item.theme
                        ? { scale: 0.95 }
                        : {}
                    }
                    className={`px-4 py-2 rounded ${
                      activeTheme === item.theme
                        ? "bg-green-500 text-white cursor-default"
                        : xp >= item.price
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {activeTheme === item.theme ? "Активно" : "Применить"}
                  </motion.button>
                ) : (
                  <span className="text-sm text-gray-500">
                    Доступно с {item.unlockLevel} уровня
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <button
            onClick={() => applyTheme(null)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
          >
            Сбросить оформление
          </button>
        </div>
      </div>
    </div>
  );
}
