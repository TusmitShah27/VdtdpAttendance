import React, { useState } from 'react';
import { Icon } from './Icon';
import { auth } from '../services/firebase';

interface LoginPageProps {}

export const LoginPage: React.FC<LoginPageProps> = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Using email for username field, as Firebase Auth standard is email/password
    try {
      await auth.signInWithEmailAndPassword(username, password);
      // onAuthStateChanged in App.tsx will handle successful login
    } catch (err: any) {
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Invalid username or password.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        default:
          setError('An unexpected error occurred. Please try again.');
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-950 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <div className="w-28 h-28 inline-block rounded-full mb-4 overflow-hidden shadow-lg bg-stone-900">
                 <Icon type="appLogo" className="w-full h-full object-cover" />
            </div>
          <h1 className="text-4xl font-bold text-orange-100" style={{ fontFamily: 'sans-serif' }}>वक्रतुंड</h1>
          <p className="text-stone-400 mt-2">श्री गणेश मंदिर संस्थान</p>
        </div>

        <form onSubmit={handleLogin} className="bg-stone-900 shadow-lg rounded-xl px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-stone-300 text-sm font-bold mb-2" htmlFor="username">
              Username (Email)
            </label>
            <input
              id="username"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              placeholder="user@example.com"
              autoComplete="email"
            />
          </div>
          <div className="mb-6">
            <label className="block text-stone-300 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:bg-stone-700 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? <Icon type="spinner" className="w-6 h-6" /> : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};