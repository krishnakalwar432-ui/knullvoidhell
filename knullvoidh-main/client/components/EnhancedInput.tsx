import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  success?: boolean;
  focused?: boolean;
  showCharCounter?: boolean;
  maxLength?: number;
  showPasswordStrength?: boolean;
  helperText?: string;
}

const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ 
    label, 
    icon, 
    error, 
    success, 
    type = 'text', 
    className = '',
    showCharCounter = false,
    maxLength,
    showPasswordStrength = false,
    helperText,
    value = '',
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    // Calculate password strength
    const getPasswordStrength = (pwd: string) => {
      let strength = 0;
      if (pwd.length >= 8) strength++;
      if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
      if (/\d/.test(pwd)) strength++;
      if (/[^a-zA-Z\d]/.test(pwd)) strength++;
      return strength;
    };

    const passwordStrength = isPassword ? getPasswordStrength(String(value)) : 0;
    const strengthColor = {
      0: 'bg-gray-500',
      1: 'bg-red-500',
      2: 'bg-orange-500',
      3: 'bg-yellow-500',
      4: 'bg-green-500'
    };
    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCharCount(e.target.value.length);
      props.onChange?.(e);
    };

    // Omit native drag/drop handlers because they conflict with
    // framer-motion's `onDrag*` signatures when spreading `props`
    // into `motion.input`.
    const { onDrag, onDragStart, onDragEnd, onDrop, ...rest } = props;

    return (
      <div className="w-full space-y-2">
        {/* Label with floating animation */}
        {label && (
          <motion.label
            className="block text-sm font-medium text-gray-300 cursor-pointer"
            animate={{ 
              opacity: isFocused ? 1 : 0.8,
              y: isFocused ? -4 : 0
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.label>
        )}

        <div className="relative">
          {/* Icon with animation */}
          {icon && (
            <motion.div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 z-10 pointer-events-none"
              animate={{
                color: isFocused ? '#06b6d4' : error ? '#ef4444' : '#06b6d4',
                scale: isFocused ? 1.1 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              {icon}
            </motion.div>
          )}

          {/* Input Field with enhanced styles */}
          <motion.input
            ref={ref}
            type={inputType}
            className={`
              w-full px-4 py-3 rounded-lg
              bg-gray-900/40 border-2 transition-all duration-300
              text-white placeholder-gray-500
              focus:outline-none
              ${icon ? 'pl-12' : ''}
              ${isPassword && showPassword ? 'pr-12' : ''}
              ${error 
                ? 'border-red-500/50 focus:border-red-500 focus:bg-red-950/10' 
                : success 
                ? 'border-green-500/50 focus:border-green-500 focus:bg-green-950/10'
                : 'border-cyan-500/30 focus:border-cyan-400 focus:bg-cyan-950/10'
              }
              ${className}
            `}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={handleChange}
            maxLength={maxLength}
            {...(rest as any)}
          />

          {/* Shimmer effect on focus */}
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              background: isFocused
                ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
                : 'transparent',
            }}
            animate={isFocused ? {
              x: ['0%', '100%'],
            } : {}}
            transition={isFocused ? {
              duration: 2,
              repeat: Infinity,
            } : {}}
          />

          {/* Password Toggle Button */}
          {isPassword && (
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 z-10 transition-colors"
              tabIndex={-1}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </motion.button>
          )}

          {/* Success icon with animation */}
          {success && !error && (
            <motion.div
              className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            >
              <Check size={20} className="drop-shadow-lg" />
            </motion.div>
          )}

          {/* Error icon with animation */}
          {error && (
            <motion.div
              className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              whileHover={{ scale: 1.2 }}
            >
              <AlertCircle size={20} className="drop-shadow-lg" />
            </motion.div>
          )}

          {/* Border Glow */}
          <motion.div
            className="absolute -inset-1 rounded-lg pointer-events-none"
            style={{
              background: error 
                ? `radial-gradient(ellipse at center, rgba(239, 68, 68, 0.2), transparent 70%)`
                : success
                ? `radial-gradient(ellipse at center, rgba(34, 197, 94, 0.2), transparent 70%)`
                : isFocused
                ? `radial-gradient(ellipse at center, rgba(6, 182, 212, 0.2), transparent 70%)`
                : 'transparent',
            }}
            animate={{
              opacity: isFocused || error || success ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Character Counter */}
        {showCharCounter && maxLength && (
          <motion.div
            className="flex justify-end text-xs text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {charCount} / {maxLength}
          </motion.div>
        )}

        {/* Password Strength Indicator */}
        {showPasswordStrength && isPassword && (
          <AnimatePresence>
            {passwordStrength > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                {/* Strength Bar */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <motion.div
                      key={level}
                      className={`h-1 flex-1 rounded-full ${
                        level <= passwordStrength ? strengthColor[passwordStrength] : 'bg-gray-700'
                      }`}
                      animate={{
                        scaleX: level <= passwordStrength ? 1 : 0.5,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>
                {/* Strength Label */}
                <motion.p className="text-xs text-right font-medium" animate={{
                  color: passwordStrength === 4 ? '#22c55e' : passwordStrength === 3 ? '#eab308' : passwordStrength === 2 ? '#f97316' : '#ef4444'
                }}>
                  {strengthLabel[passwordStrength]}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Error Message with animation */}
        <AnimatePresence>
          {error && (
            <motion.p
              className="text-red-400 text-sm font-medium"
              initial={{ opacity: 0, y: -10, x: -10 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -10, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              ✗ {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Helper Text */}
        <AnimatePresence>
          {helperText && !error && (
            <motion.p
              className="text-gray-400 text-xs"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';

export default EnhancedInput;
