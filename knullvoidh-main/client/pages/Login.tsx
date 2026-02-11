import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import InteractiveCosmicBackground from "@/components/InteractiveCosmicBackground";
import EnhancedButton from "@/components/buttons/EnhancedButton";
import EnhancedInput from "@/components/EnhancedInput";
import LightningCanvas from "@/components/LightningCanvas";
import { Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const Login: React.FC = () => {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});

  const validateForm = () => {
    const errors: typeof validationErrors = {};

    if (!identifier.trim()) {
      errors.identifier = "Email is required";
    } else if (!identifier.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.identifier = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await login(identifier, password);
      setSuccess(true);
      setValidationErrors({});

      // Wait for animation before redirecting
      setTimeout(() => {
        nav("/profile");
      }, 1000);
    } catch (err: any) {
      const code = err?.code;
      if (code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Incorrect password. Please try again.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      setSuccess(true);
      setTimeout(() => {
        nav("/profile");
      }, 1000);
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Google sign-in failed.");
      }
      setSuccess(false);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!identifier.trim() || !identifier.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Please enter a valid email address first, then click Forgot Password.");
      return;
    }
    try {
      await resetPassword(identifier);
      setResetSent(true);
      setError("");
    } catch (err: any) {
      setError("Failed to send reset email. Check if the email is correct.");
    }
  };

  // Trigger a canvas lightning burst on success for dramatic effect
  React.useEffect(() => {
    if (!success) return;
    const elem = document.getElementById('login-root');
    if (!elem) return;
    const rect = elem.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const ev = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: Math.round(cx),
      clientY: Math.round(cy),
    });
    // dispatch to the element so LightningCanvas receives coordinates
    elem.dispatchEvent(ev);
  }, [success]);

  return (
    <div className="relative min-h-screen bg-black text-white flex items-center justify-center p-4 overflow-hidden">
      <InteractiveCosmicBackground />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [-200, 200],
            y: [-200, 200],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{
            x: [200, -200],
            y: [200, -200],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </div>

      {/* Main Content */}
      <motion.div
        className="relative z-20 w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <LightningCanvas targetId="login-root" theme="purple" />
        {/* Header */}
        <motion.div className="text-center mb-8" variants={itemVariants}>
          <motion.h1
            className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent mb-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            NULLVOID
          </motion.h1>
          <motion.p className="text-gray-400 text-sm" variants={itemVariants}>
            Enter the cosmic realm of gaming
          </motion.p>
        </motion.div>

        {/* Form Container */}
        <motion.form
          id="login-root"
          onSubmit={handleSubmit}
          className="relative space-y-5"
          variants={itemVariants}
        >
          {/* Glassmorphism card */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-800/6 to-cyan-600/6 backdrop-blur-md border border-gradient-to-r"
            style={{
              borderImage: 'linear-gradient(90deg, rgba(138,92,246,0.18), rgba(6,182,212,0.12)) 1',
            }}
            animate={{
              boxShadow: [
                "0 0 20px rgba(168, 85, 247, 0.1)",
                "0 0 40px rgba(6, 182, 212, 0.1)",
                "0 0 20px rgba(168, 85, 247, 0.1)",
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
            }}
          />

          {/* Form Content */}
          <div className="relative z-10 p-8 space-y-5">
            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}

              {success && (
                <motion.div
                  className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                  <p className="text-green-400 text-sm">
                    Login successful! Redirecting...
                  </p>
                </motion.div>
              )}

              {resetSent && (
                <motion.div
                  className="flex items-center gap-3 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <CheckCircle size={20} className="text-cyan-400 flex-shrink-0" />
                  <p className="text-cyan-400 text-sm">
                    Password reset email sent! Check your inbox.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Input */}
            <motion.div variants={itemVariants}>
              <EnhancedInput
                label="Email Address"
                icon={<Mail size={20} />}
                type="email"
                placeholder="Enter your email"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (validationErrors.identifier) {
                    setValidationErrors({
                      ...validationErrors,
                      identifier: undefined,
                    });
                  }
                }}
                error={validationErrors.identifier}
                helperText="Enter your registered email"
                showCharCounter
                maxLength={100}
                required
              />
            </motion.div>

            {/* Password Input */}
            <motion.div variants={itemVariants}>
              <EnhancedInput
                label="Password"
                icon={<Lock size={20} />}
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationErrors.password) {
                    setValidationErrors({
                      ...validationErrors,
                      password: undefined,
                    });
                  }
                }}
                error={validationErrors.password}
                helperText="Keep your password secure"
                required
              />
            </motion.div>

            {/* Forgot Password Link */}
            <motion.div
              className="flex justify-end"
              variants={itemVariants}
            >
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors underline bg-transparent border-none cursor-pointer"
              >
                Forgot password?
              </button>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants}>
              <EnhancedButton
                type="submit"
                size="lg"
                variant="primary"
                loading={loading}
                disabled={loading || success || googleLoading}
                className="w-full"
              >
                {loading ? "Signing in..." : success ? "Signed in!" : "Sign In"}
              </EnhancedButton>
            </motion.div>

            {/* Divider */}
            <motion.div className="flex items-center gap-4" variants={itemVariants}>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
              <span className="text-gray-500 text-xs uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
            </motion.div>

            {/* Google Sign-In Button */}
            <motion.div variants={itemVariants}>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || success || googleLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl border border-gray-600/50 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white font-medium transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-cyan-400 rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                <span>{googleLoading ? "Signing in..." : "Continue with Google"}</span>
              </button>
            </motion.div>

            {/* Register Link */}
            <motion.div
              className="text-center pt-2"
              variants={itemVariants}
            >
              <p className="text-gray-400 text-sm">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors underline"
                >
                  Create one
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.form>

        {/* Decorative Elements */}
        <motion.div className="mt-8 flex justify-center gap-2" variants={itemVariants}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-cyan-400"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <svg
          className="w-6 h-6 text-cyan-400/30"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </motion.div>
    </div>
  );
};

export default Login;
