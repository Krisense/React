import Editor from '@monaco-editor/react';

function CodeEditor({ code, onChange }) {
  return (
    <Editor
      height="400px"
      language="javascript"
      theme="vs-dark"
      value={code}
      onChange={onChange}
      options={{ 
        minimap: { enabled: false },
        fontSize: 14,
      }}
    />
  );
}

function executeCode(code) {
    try {
      return new Function(code)();
    } catch (error) {
      return error.message;
    }
  }