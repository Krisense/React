import Editor from '@monaco-editor/react';
import { useEffect } from 'react';

export default function CodeEditor({ code, onChange, height = '500px' }) {
  // Инициализация кастомных тем
  useEffect(() => {
    const defineCustomThemes = () => {
      if (window.monaco) {
        // Тёмная тема
        window.monaco.editor.defineTheme('custom-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: '', foreground: 'D4D4D4' }, // Основной цвет текста
            { token: 'keyword', foreground: '569CD6' },
            { token: 'number', foreground: 'B5CEA8' },
            { token: 'string', foreground: 'CE9178' },
          ],
          colors: {
            'editor.background': '#1E1E1E',
            'editor.foreground': '#D4D4D4',
          }
        });

        // Ретро тема
        window.monaco.editor.defineTheme('custom-retro', {
          base: 'vs',
          inherit: true,
          rules: [
            { token: '', foreground: '5C4D3C' }, // Основной цвет текста
            { token: 'keyword', foreground: '7D5A3A' },
            { token: 'number', foreground: '8B7355' },
            { token: 'string', foreground: '9C6D5B' },
          ],
          colors: {
            'editor.background': '#F0E6D2',
            'editor.foreground': '#5C4D3C',
          }
        });

        // Высококонтрастная тема
        window.monaco.editor.defineTheme('custom-high-contrast', {
          base: 'hc-black',
          inherit: true,
          rules: [
            { token: '', foreground: 'FFFF00' }, // Основной цвет текста
            { token: 'keyword', foreground: '00FFFF' },
            { token: 'number', foreground: '00FF00' },
            { token: 'string', foreground: 'FFA500' },
          ],
          colors: {
            'editor.background': '#000000',
            'editor.foreground': '#FFFF00',
          }
        });
      }
    };

    defineCustomThemes();
  }, []);

  // Реакция на смену темы
  useEffect(() => {
    const handleThemeChange = () => {
      if (window.monaco) {
        const themeClass = Array.from(document.documentElement.classList)
          .find(cls => cls.startsWith('theme-')) || 'theme-default';
        
        const themeMap = {
          'theme-dark': 'custom-dark',
          'theme-retro': 'custom-retro',
          'theme-high-contrast': 'custom-high-contrast',
          'theme-default': 'vs'
        };

        window.monaco.editor.setTheme(themeMap[themeClass] || 'vs');
      }
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  return (
    <div className="border rounded-lg overflow-hidden">
      <Editor
        height={height}
        defaultLanguage="javascript"
        theme={document.documentElement.classList.contains('theme-dark') ? 'custom-dark' : 'vs'}
        value={code}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          fontFamily: 'Fira Code, monospace', // Можно изменить шрифт
          fontWeight: '400',
        }}
      />
    </div>
  );
}