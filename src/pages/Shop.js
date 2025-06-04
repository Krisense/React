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
    price: 1500,
    unlockLevel: 8,
    theme: "retro",
  },
  {
    id: 3,
    name: "Контрастный режим",
    description: "Яркие цвета для лучшей читаемости",
    price: 1000,
    unlockLevel: 6,
    theme: "high-contrast",
  },
];

export default function Shop() {
  const { level, xp } = useProgress();
  const [activeTheme, setActiveTheme] = useState(null);

  // Загрузка сохраненной темы при монтировании
  useEffect(() => {
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
      setActiveTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  // Функция применения темы
const applyTheme = (theme) => {
  // Полностью очищаем все классы тем
  document.documentElement.classList.remove(
    'theme-default',
    'theme-dark',
    'theme-retro',
    'theme-high-contrast'
  );
  
  // Добавляем стандартные классы Tailwind
  document.documentElement.classList.add('min-h-screen');
  
  // Если тема не null, добавляем соответствующий класс
  if (theme) {
    document.documentElement.classList.add(`theme-${theme}`);
  } else {
    document.documentElement.classList.add('theme-default');
  }
  
  // Сохраняем в localStorage
  localStorage.setItem('selectedTheme', theme || 'default');
  setActiveTheme(theme);
  
  // Принудительное обновление редактора кода
  window.dispatchEvent(new Event('themeChanged'));
};

  // Функция покупки и применения темы
  const handlePurchase = (item) => {
    if (xp >= item.price) {
      applyTheme(item.theme);
    }
  };

  return (
    <div className="min-h-screen bg-primaryback">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Магазин внешнего вида</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SHOP_ITEMS.map(item => (
            <motion.div 
              key={item.id}
              whileHover={{ scale: 1.03 }}
              className={`border rounded-lg p-4 bg-white ${level < item.unlockLevel ? 'opacity-50' : ''}`}
            >
              <h3 className="text-xl font-semibold">{item.name}</h3>
              <p className="text-primary mb-2">{item.description}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-yellow-600 font-bold">{item.price} XP</span>
                {level >= item.unlockLevel ? (
                  <motion.button
                    onClick={() => handlePurchase(item)}
                    disabled={xp < item.price || activeTheme === item.theme}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded ${
                      activeTheme === item.theme 
                        ? 'bg-green-500 text-white cursor-default' 
                        : xp >= item.price 
                          ? 'bg-blue-500 text-white hover:bg-blue-600' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {activeTheme === item.theme ? 'Активно' : 'Применить'}
                  </motion.button>
                ) : (
                  <span className="text-sm text-gray-500">
                    Доступно с {item.unlockLevel} уровня
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8">
          <motion.button 
            onClick={() => applyTheme(null)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-white hover:bg-gray-300 rounded border rounded-lg"
          >
            Сбросить оформление
          </motion.button>
        </div>
      </div>
    </div>
  );
}
