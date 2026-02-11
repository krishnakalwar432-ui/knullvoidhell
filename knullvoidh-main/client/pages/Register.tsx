import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import InteractiveCosmicBackground from "@/components/InteractiveCosmicBackground";
import EnhancedButton from "@/components/buttons/EnhancedButton";
import EnhancedInput from "@/components/EnhancedInput";
import { Mail, Lock, User, Globe, AlertCircle, CheckCircle } from "lucide-react";

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

const REGIONS = ["Global", "North America", "Europe", "Asia", "South America", "Oceania"];

const Register: React.FC = () => {
  const { register, loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("Global");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const errors: typeof validationErrors = {};

    if (!username.trim()) {
      errors.username = "Username is required";
    } else if (username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.username = "Username can only contain letters, numbers, underscores, and hyphens";
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
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
      await register({ username, email, password, region });
      setSuccess(true);
      setValidationErrors({});

      // Wait for animation before redirecting
      setTimeout(() => {
        nav("/profile");
      }, 1500);
    } catch (err: any) {
      const code = err?.code;
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Try signing in instead.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Please use at least 6 characters.");
      } else if (code === "auth/invalid-email") {
        setError("Invalid email address format.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
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

  return (
    <div className="relative min-h-screen bg-black text-white flex items-center justify-center p-4 overflow-hidden">
      <InteractiveCosmicBackground />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
          animate={{
            x: [200, -200],
            y: [-200, 200],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{
            x: [-200, 200],
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
        {/* Header */}
        <motion.div className="text-center mb-8" variants={itemVariants}>
          <motion.h1
            className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            JOIN NULLVOID
          </motion.h1>
          <motion.p className="text-gray-400 text-sm" variants={itemVariants}>
            Create your gaming profile and enter the void
          </motion.p>
        </motion.div>

        {/* Form Container */}
        <motion.form
          onSubmit={handleSubmit}
          className="relative space-y-5"
          variants={itemVariants}
        >
          {/* Glassmorphism card */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-pink-500/10 rounded-2xl backdrop-blur-md border border-cyan-500/20"
            animate={{
              boxShadow: [
                "0 0 20px rgba(6, 182, 212, 0.1)",
                "0 0 40px rgba(236, 72, 153, 0.1)",
                "0 0 20px rgba(6, 182, 212, 0.1)",
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
            }}
          />

          {/* Form Content */}
          <div className="relative z-10 p-8 space-y-4">
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
                    Account created! Redirecting to profile...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Sign-In Button (at top) */}
            <motion.div variants={itemVariants}>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || success || googleLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl border border-gray-600/50 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white font-medium transition-all duration-300 hover:border-pink-500/40 hover:shadow-[0_0_20px_rgba(236,72,153,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-pink-400 rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                <span>{googleLoading ? "Signing up..." : "Sign up with Google"}</span>
              </button>
            </motion.div>

            {/* Divider */}
            <motion.div className="flex items-center gap-4" variants={itemVariants}>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
              <span className="text-gray-500 text-xs uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
            </motion.div>

            {/* Username Input */}
            <motion.div variants={itemVariants}>
              <EnhancedInput
                label="Username"
                icon={<User size={20} />}
                type="text"
                placeholder="Choose your gaming username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (validationErrors.username) {
                    setValidationErrors({
                      ...validationErrors,
                      username: undefined,
                    });
                  }
                }}
                error={validationErrors.username}
                helperText="3+ characters, alphanumeric with _ and -"
                showCharCounter
                maxLength={20}
                required
              />
            </motion.div>

            {/* Email Input */}
            <motion.div variants={itemVariants}>
              <EnhancedInput
                label="Email Address"
                icon={<Mail size={20} />}
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) {
                    setValidationErrors({
                      ...validationErrors,
                      email: undefined,
                    });
                  }
                }}
                error={validationErrors.email}
                helperText="We'll use this to verify your account"
                required
              />
            </motion.div>

            {/* Region Select */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Globe size={16} className="inline mr-2" />
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-900/40 border-2 border-cyan-500/30 focus:border-cyan-400 text-white focus:outline-none transition-all duration-300 cursor-pointer"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </motion.div>

            {/* Password Input */}
            <motion.div variants={itemVariants}>
              <EnhancedInput
                label="Password"
                icon={<Lock size={20} />}
                type="password"
                placeholder="Create a strong password"
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
                helperText="Password strength indicator below"
                showPasswordStrength
                required
              />
            </motion.div>

            {/* Confirm Password Input */}
            <motion.div variants={itemVariants}>
              <EnhancedInput
                label="Confirm Password"
                icon={<Lock size={20} />}
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (validationErrors.confirmPassword) {
                    setValidationErrors({
                      ...validationErrors,
                      confirmPassword: undefined,
                    });
                  }
                }}
                error={validationErrors.confirmPassword}
                helperText="Passwords must match"
                required
              />
            </motion.div>

            {/* Password Requirements */}
            <motion.div
              className="p-3 bg-gray-900/30 border border-gray-700/50 rounded-lg text-xs text-gray-400 space-y-1"
              variants={itemVariants}
            >
              <p className="font-semibold text-gray-300">Password must contain:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>At least 6 characters</li>
              </ul>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants}>
              <EnhancedButton
                type="submit"
                size="lg"
                variant="secondary"
                loading={loading}
                disabled={loading || success || googleLoading}
                className="w-full"
              >
                {loading ? "Creating Account..." : success ? "Account Created!" : "Create Account"}
              </EnhancedButton>
            </motion.div>

            {/* Login Link */}
            <motion.div
              className="text-center pt-2"
              variants={itemVariants}
            >
              <p className="text-gray-400 text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors underline"
                >
                  Sign in
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
              className="w-2 h-2 rounded-full bg-pink-400"
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
          className="w-6 h-6 text-pink-400/30"
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

export default Register;
