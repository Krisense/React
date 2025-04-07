function ProgressBar({ completed }) {
    return (
      <div className="w-full bg-gray-200 rounded">
        <div 
          className="bg-green-500 h-4 rounded" 
          style={{ width: `${completed}%` }}
        ></div>
      </div>
    );
  }