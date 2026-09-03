import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import logoSeal from '../assets/logo-seal.jpeg';
import authApi from '../api/authApi';
import useTheme from '../hooks/useTheme';
import FormField from '../components/common/FormField';
import Button from '../components/common/Button';

const OTP_LENGTH = 6;
// Matches the server's own resend cooldown (see RESEND_COOLDOWN_MS in
// passwordResetController.js) so this countdown always lines up with what
// the backend will actually accept — the server remains the real
// enforcement either way, this is purely a friendly UI countdown.
const RESEND_COOLDOWN_SECONDS = 60;

// Six separate boxes (matches the requested "[ _ _ _ _ _ _ ]" layout)
// rather than one plain text input — supports paste, auto-advance, and
// backspace-to-previous-box.
function OtpInput({ value, onChange }) {
  const inputsRef = useRef([]);
  const digits = value.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH);

  const handleChange = (index, e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const next = digits.slice();
    if (!raw) {
      next[index] = '';
      onChange(next.join(''));
      return;
    }
    let i = index;
    for (const ch of raw.split('')) {
      if (i >= OTP_LENGTH) break;
      next[i] = ch;
      i += 1;
    }
    onChange(next.join(''));
    inputsRef.current[Math.min(i, OTP_LENGTH - 1)]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {digits.map((d, i) => (
        <input
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-12 w-11 rounded-lg border border-gray-300 bg-white text-center text-xl font-bold text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      ))}
    </div>
  );
}

// AuthShell: the seal watermark + card frame shared with LoginPage, kept
// local to this page rather than factored out since only these two screens
// use it.
function AuthShell({ children }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-offwhite px-4 dark:bg-gray-900">
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
        {children}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  // Pre-fills the registered email so it never needs to be typed manually —
  // an explicit convenience tradeoff (this page is public/unauthenticated,
  // so the address is visible to anyone who opens it before they've proven
  // they know it). See passwordResetController.getAdminEmail.
  useEffect(() => {
    authApi.getAdminEmail().then((data) => {
      if (data?.email) setEmail(data.email);
    }).catch(() => {});
  }, []);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Shared by the initial "Continue" submit and the "Resend Code" button —
  // both hit the same endpoint and start the same cooldown.
  const requestOtp = async ({ isResend } = {}) => {
    setSubmitting(true);
    try {
      const result = await authApi.forgotPassword(email.trim());
      if (result?.devOtp) {
        // Dev-mode fallback: SMTP isn't configured server-side yet, so the
        // code couldn't actually be emailed — it's shown on screen instead
        // so the flow stays testable. See server/src/utils/mailer.js.
        setDevOtp(result.devOtp);
        toast.success(isResend ? 'A new code is shown on screen (dev mode).' : 'Email is not configured yet — your code is shown on screen.');
      } else {
        setDevOtp('');
        toast.success(isResend ? 'A new verification code has been sent.' : 'A verification code has been sent to your email.');
      }
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      if (!isResend) setStep('otp');
    } catch (err) {
      toast.error(err.message || 'Failed to send the verification code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestOtp = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your registered email.');
      return;
    }
    requestOtp({ isResend: false });
  };

  const handleResend = () => {
    if (resendCooldown > 0 || submitting) return;
    setOtp('');
    requestOtp({ isResend: true });
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH) {
      toast.error('Please enter the full 6-digit code.');
      return;
    }
    setSubmitting(true);
    try {
      const data = await authApi.verifyResetOtp(email.trim(), otp);
      setResetToken(data.resetToken);
      toast.success('Code verified. You can now set a new password.');
      setStep('reset');
    } catch (err) {
      toast.error(err.message || 'Verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword(resetToken, newPassword);
      toast.success('Your password has been reset. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'email') {
    return (
      <AuthShell>
        <h2 className="mb-1 text-center text-lg font-bold text-gray-900 dark:text-gray-100">Forgot Password?</h2>
        <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Enter your registered email and we'll send you a verification code.
        </p>
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
          <FormField
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your registered email"
            autoComplete="email"
            disabled
            required
          />
          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? 'Sending...' : 'Continue'}
          </Button>
          <Link
            to="/login"
            className="text-center text-sm font-medium text-brand-red hover:underline dark:text-red-400"
          >
            ← Back to Sign In
          </Link>
        </form>
      </AuthShell>
    );
  }

  if (step === 'otp') {
    return (
      <AuthShell>
        <h2 className="mb-1 text-center text-lg font-bold text-gray-900 dark:text-gray-100">Enter Verification Code</h2>
        <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
          A 6-digit code was sent to <span className="font-semibold text-gray-700 dark:text-gray-200">{email}</span>.
          It expires in 10 minutes.
        </p>
        {devOtp && (
          <div className="mb-4 rounded-lg border border-brand-gold/40 bg-brand-gold/10 px-4 py-3 text-center dark:border-brand-gold/30 dark:bg-brand-gold/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Dev mode — email isn't configured yet
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-gray-900 dark:text-gray-100">{devOtp}</p>
          </div>
        )}
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <OtpInput value={otp} onChange={setOtp} />
          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? 'Verifying...' : 'Verify Code'}
          </Button>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || submitting}
              className="font-medium text-brand-red hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline dark:text-red-400 dark:disabled:text-gray-500"
            >
              {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
            </button>
          </p>
          <button
            type="button"
            onClick={() => {
              setStep('email');
              setOtp('');
              setResendCooldown(0);
            }}
            className="text-center text-sm font-medium text-brand-red hover:underline dark:text-red-400"
          >
            ← Use a different email
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h2 className="mb-1 text-center text-lg font-bold text-gray-900 dark:text-gray-100">Set a New Password</h2>
      <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Choose a new password for your account.
      </p>
      <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
        <FormField
          label="New Password"
          name="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
        />
        <FormField
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter new password"
          autoComplete="new-password"
          required
        />
        <Button type="submit" disabled={submitting} className="mt-2 w-full">
          {submitting ? 'Saving...' : 'Reset Password'}
        </Button>
      </form>
    </AuthShell>
  );
}
