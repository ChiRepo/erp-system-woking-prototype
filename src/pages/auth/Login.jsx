/**
 * @fileoverview AUTH Login Page - KRC Institute of Technology
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GraduationCap, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BootstrapSpinner from '../../components/ui/BootstrapSpinner';
import PageTransition from '../../components/layout/PageTransition';
import LiveClock from '../../components/common/LiveClock';
import { isGoogleSignInContinuation } from '../../utils/googleSignInEntry.js';

export default function Login({ entryLocation = window.location } = {}) {
  const { user, role, signIn, signInWithGoogle, authError, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const continuationStarted = useRef(false);
  useEffect(() => {
    if (authLoading || continuationStarted.current || !isGoogleSignInContinuation(entryLocation)) return;
    continuationStarted.current = true;
    // Consume the entry marker before leaving so a cancelled or completed login cannot loop.
    navigate('/login', { replace: true });
    setGoogleLoading(true);
    signInWithGoogle({ redirect: true }).catch(error => {
      setError(error.message || 'Google sign-in could not start. Please retry.');
      setGoogleLoading(false);
    });
  }, [authLoading, user, signInWithGoogle, navigate, entryLocation]);

  // Surface any redirect errors from AuthContext
  useEffect(() => {
    if (authError) {
      let cleanAuthMsg = authError;
      if (authError.includes('auth/user-disabled')) {
        cleanAuthMsg = 'This user account has been disabled. Please contact university administration.';
      } else if (authError.includes('auth/unauthorized-domain')) {
        cleanAuthMsg = 'This domain is not authorized for Google Sign-In. Please access via the official campus URL (https://erp-system-mit.web.app).';
      }
      setError(`Google sign-in failed: ${cleanAuthMsg}`);
    }
  }, [authError]);

  // If authenticated with authoritative institutional role, redirect immediately to target dashboard
  useEffect(() => {
    if (!authLoading && user && role && !continuationStarted.current) {
      navigate(role === 'guest' ? '/' : `/${role}/dashboard`, { replace: true });
    }
  }, [authLoading, user, role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const signedIn = await signIn(email, password);
      if (signedIn) {
        const targetRole = signedIn.role;
        if (targetRole && targetRole !== 'guest') {
          navigate(`/${targetRole}/dashboard`, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    } catch (err) {
      let msg = err.message || 'Invalid credentials or account not found.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'Incorrect email or password. Please verify your institution credentials.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Access temporarily restricted due to many failed attempts. Please try again later.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const signedInUser = await signInWithGoogle();
      if (signedInUser) {
        const targetRole = signedInUser.role;
        if (targetRole && targetRole !== 'guest') {
          navigate(`/${targetRole}/dashboard`, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    } catch (err) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        let msg = err.message || 'Authentication error';
        if (err.code === 'auth/user-disabled') {
          msg = 'This user account has been disabled. Please contact university administration.';
        } else if (err.code === 'auth/unauthorized-domain') {
          msg = 'This domain is not authorized for Google Sign-In. Please access via the official campus URL (https://erp-system-mit.web.app).';
        } else if (err.code === 'auth/network-request-failed') {
          msg = 'Network connection failed. Please check your internet connection.';
        } else if (err.code === 'auth/account-exists-with-different-credential') {
          msg = 'An account already exists with this email address. Please sign in with your email & password.';
        }
        setError(`Google sign-in failed: ${msg}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };




  return (
    <PageTransition>
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-bg p-3.5 sm:p-4">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-6 sm:mb-8 text-text">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-text transition-colors">
                ← Back to KRC IT Website
              </Link>
              <LiveClock compact={true} />
            </div>
            <div className="flex justify-center mb-3">
              <Link to="/" className="group cursor-pointer inline-block" title="Back to KRC IT Home">
                <div className="p-2.5 sm:p-3 bg-surface border border-border group-hover:border-text/50 dark:border-white/20 dark:group-hover:border-white/45 rounded-xl shadow-sm transition-all group-active:scale-95">
                  <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-text stroke-[1.8]" />
                </div>
              </Link>
            </div>
            <Link to="/" className="inline-block hover:opacity-85 transition">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">KRC Institute of Technology</h1>
            </Link>
            <p className="text-xs text-muted mt-1">Sign in with your academic credentials or Google</p>
          </div>

          <div className="bg-surface border border-border p-5 sm:p-8 rounded-xl shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-text uppercase tracking-wider">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-text transition-colors"
                  placeholder="admin@krc.edu or student@krc.edu"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-semibold text-text uppercase tracking-wider">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-medium text-muted hover:text-text flex items-center gap-1 transition-colors focus:outline-none select-none py-0.5 px-1.5 rounded hover:bg-surface"
                    tabIndex={-1}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={showPassword ? 'hide' : 'show'}
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 2 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="inline-flex items-center gap-1"
                      >
                        {showPassword ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Show</span>
                          </>
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </button>
                </div>

                <div className="relative flex items-center w-full">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-bg border border-border rounded-md pl-3 pr-10 py-2 text-sm text-text font-mono focus:outline-none focus:border-text transition-colors duration-150"
                    placeholder="••••••••"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 p-1 rounded-md text-muted hover:text-text hover:bg-surface/80 active:scale-90 transition-all focus:outline-none"
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {showPassword ? (
                        <motion.div
                          key="eye-off-icon"
                          initial={{ opacity: 0, scale: 0.75, rotate: -12 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0.75, rotate: 12 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                          <EyeOff className="w-4 h-4 text-muted hover:text-text transition-colors" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="eye-icon"
                          initial={{ opacity: 0, scale: 0.75, rotate: 12 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0.75, rotate: -12 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                          <Eye className="w-4 h-4 text-muted hover:text-text transition-colors" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-text hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 text-bg text-sm font-medium py-2.5 rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <BootstrapSpinner type="border" size="sm" className="mr-1.5" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In with Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="my-5 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-surface text-muted">OR</span>
              </div>
            </div>

            <button
              onClick={handleGoogle}
              disabled={loading || googleLoading}
              type="button"
              className="w-full flex items-center justify-center gap-2 bg-surface hover:bg-bg text-text text-sm font-medium py-2.5 rounded-md transition-colors border border-border disabled:opacity-50"
            >
              {googleLoading ? (
                <>
                  <BootstrapSpinner type="grow" size="sm" variant="success" className="mr-1.5" />
                  <span>Connecting to Google Account...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" opacity="0.8" d="M12 24c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 21.53 7.7 24 12 24z" />
                    <path fill="currentColor" opacity="0.6" d="M5.84 15.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V8.06H2.18C1.43 9.55 1 11.22 1 13s.43 3.45 1.18 4.94l3.66-2.84z" />
                    <path fill="currentColor" opacity="0.4" d="M12 4.75c1.61 0 3.06.56 4.2 1.64l3.15-3.15C17.45 1.43 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.06l3.66 2.84c.87-2.6 3.3-4.15 6.16-4.15z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Academic Portal Credentials Guide */}
            <div className="mt-6 pt-5 border-t border-border">
              <div className="bg-bg/80 border border-border/80 rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-text font-semibold text-[11px] uppercase tracking-wider">
                  <GraduationCap className="w-3.5 h-3.5 text-muted" />
                  <span>Institutional Access Portal</span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Sign in using your institutional email address (e.g. <span className="font-mono text-text">admin@krc.edu</span>, <span className="font-mono text-text">faculty@krc.edu</span>, or <span className="font-mono text-text">student@krc.edu</span>) and assigned password.
                </p>
                <p className="text-[10px] text-muted/80">
                  New faculty and students can update their starting passwords anytime from their portal settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Copyright Notice - Visible in codebase, hidden in UI/UX */}
      <footer className="sr-only" aria-hidden="true">
        <p>Copyright &copy; 2026 Chinmay Chaudhari. All Rights Reserved. (MIT License)</p>
      </footer>
    </PageTransition>
  );
}

