import React from "react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center p-4">
      <h1 className="text-4xl font-bold mb-4">
        Добро пожаловать в платформу изучения JavaScript
      </h1>
      <p className="text-lg text-gray-700 max-w-xl">
        Здесь вы сможете проходить интерактивные уроки, выполнять практические
        задания и отслеживать ваш прогресс.
      </p>
    </div>
  );
}
