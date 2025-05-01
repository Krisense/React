import React from 'react';

export default function ApiResponseViewer({ response, error, isLoading }) {
  if (isLoading) {
    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
          <span>Выполняем запрос...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-600 font-medium mb-1">Ошибка запроса:</h3>
        <pre className="text-sm text-red-700 overflow-auto max-h-60">
          {error instanceof Error ? error.message : JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }

  if (!response) return null;

  return (
    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="text-gray-700 font-medium mb-1">Результат запроса:</h3>
      <pre className="text-sm text-gray-800 overflow-auto max-h-60">
        {JSON.stringify(response, null, 2)}
      </pre>
    </div>
  );
}