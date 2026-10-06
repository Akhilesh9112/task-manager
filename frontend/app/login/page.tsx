'use client';
import { supabase } from '../../utils/supabase';

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="p-8 bg-white shadow-md rounded-lg text-center">
        <h1 className="text-2xl font-bold mb-6">Task Manager Login</h1>
        <button
          onClick={handleGoogleLogin}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}