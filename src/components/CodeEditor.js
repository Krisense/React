import Editor from '@monaco-editor/react';
import { useEffect } from 'react';

export default function CodeEditor({ code, onChange, height = '500px' }) {
  // Реакция на смену темы
  useEffect(() => {
    const handleThemeChange = () => {
      // Принудительное обновление редактора
      if (window.monaco) {
        window.monaco.editor.setTheme(
          document.documentElement.classList.contains('theme-dark') 
            ? 'vs-dark' 
            : 'vs'
        );
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
        theme={document.documentElement.classList.contains('theme-dark') ? 'vs-dark' : 'vs'}
        value={code}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}