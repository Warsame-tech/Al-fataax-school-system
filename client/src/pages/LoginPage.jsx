import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import logoSeal from '../assets/logo-seal.jpeg';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import FormField from '../components/common/FormField';
import Button from '../components/common/Button';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={user.userType === 'admin' ? '/dashboard' : '/results/view'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter both username and password.');
      return;
    }
    setSubmitting(true);
    try {
      const data = await login(username, password);
      toast.success(`Welcome back, ${data.name}!`);
      navigate(data.userType === 'admin' ? '/dashboard' : '/results/view', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-offwhite px-4 dark:bg-gray-900">
      {/* Institute seal watermark — decorative, behind the login card, never intercepts clicks. */}
      <img
        src={logoSeal}
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed top-1/2 left-1/2 z-0 w-[600px] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full object-cover opacity-[0.05] select-none sm:w-[750px] lg:w-[900px]"
      />

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="fixed right-4 top-4 z-10 rounded-lg p-2 text-gray-500 hover:bg-gray-200/60 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        {theme === 'dark' ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6 flex flex-col items-center gap-3">
          <img
            src={logoSeal}
            alt="Al Fataax seal"
            className="h-20 w-20 rounded-full object-cover ring-4 ring-brand-gold shadow-md"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold text-brand-red dark:text-red-400">Al Fataax</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Education Management System</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            label="Username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            autoComplete="username"
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />
          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? 'Signing in...' : 'Sign In'}
          </Button>
          <Link
            to="/forgot-password"
            className="text-center text-sm font-medium text-brand-red hover:underline dark:text-red-400"
          >
            Forgot Password?
          </Link>
        </form>
      </div>
    </div>
  );
}
