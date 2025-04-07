import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../api/firebase';

function GoogleSignIn() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      console.log('Успешный вход!');
    } catch (error) {
      console.error('Ошибка входа:', error.message);
    }
  };

  return (
    <button 
      onClick={handleLogin}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
      Войти через Google
    </button>
  );
}