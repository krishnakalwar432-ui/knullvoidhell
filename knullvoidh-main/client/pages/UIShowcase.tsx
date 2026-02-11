import React from 'react';
import { motion } from 'framer-motion';
import EnhancedButton from '@/components/buttons/EnhancedButton';
import { Download, Trash2, Settings, Heart } from 'lucide-react';

/**
 * UI Enhancement Showcase Component
 * Demonstrates all available Enhanced Button variants and states
 */
const UIEnhancementShowcase: React.FC = () => {
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

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
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-12">
      {/* Header */}
      <motion.div
        className="max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="mb-12" variants={itemVariants}>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent mb-2">
            NULLVOID UI Enhancements
          </h1>
          <p className="text-gray-400 text-lg">
            Explore all available button variants, input styles, and UI components
          </p>
        </motion.div>

        {/* Button Variants Section */}
        <motion.section className="mb-16" variants={itemVariants}>
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <span className="inline-block w-2 h-2 bg-purple-400 rounded-full"></span>
            Button Variants
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Primary Button */}
            <motion.div
              className="p-6 rounded-xl bg-gray-900/50 border border-purple-500/20 backdrop-blur"
              whileHover={{ y: -5 }}
            >
              <h3 className="text-lg font-semibold mb-4 text-purple-400">Primary</h3>
              <div className="space-y-3 flex flex-col">
                <EnhancedButton variant="primary" size="sm">
                  Small Button
                </EnhancedButton>
                <EnhancedButton variant="primary" size="md">
                  Medium Button
                </EnhancedButton>
                <EnhancedButton variant="primary" size="lg">
                  Large Button
                </EnhancedButton>
                <EnhancedButton variant="primary" size="lg" disabled>
                  Disabled Button
                </EnhancedButton>
                <EnhancedButton
                  variant="primary"
                  size="lg"
                  loading={loadingId === 'primary'}
                  onClick={() => {
                    setLoadingId('primary');
                    setTimeout(() => setLoadingId(null), 2000);
                  }}
                >
                  Loading State
                </EnhancedButton>
              </div>
            </motion.div>

            {/* Secondary Button */}
            <motion.div
              className="p-6 rounded-xl bg-gray-900/50 border border-orange-500/20 backdrop-blur"
              whileHover={{ y: -5 }}
            >
              <h3 className="text-lg font-semibold mb-4 text-orange-400">Secondary</h3>
              <div className="space-y-3 flex flex-col">
                <EnhancedButton variant="secondary" size="sm">
                  Small Button
                </EnhancedButton>
                <EnhancedButton variant="secondary" size="md">
                  Medium Button
                </EnhancedButton>
                <EnhancedButton variant="secondary" size="lg">
                  Large Button
                </EnhancedButton>
                <EnhancedButton variant="secondary" size="lg" disabled>
                  Disabled Button
                </EnhancedButton>
                <EnhancedButton variant="secondary" size="lg">
                  <Download size={20} />
                  With Icon
                </EnhancedButton>
              </div>
            </motion.div>

            {/* Ghost Button */}
            <motion.div
              className="p-6 rounded-xl bg-gray-900/50 border border-cyan-500/20 backdrop-blur"
              whileHover={{ y: -5 }}
            >
              <h3 className="text-lg font-semibold mb-4 text-cyan-400">Ghost</h3>
              <div className="space-y-3 flex flex-col">
                <EnhancedButton variant="ghost" size="sm">
                  Small Button
                </EnhancedButton>
                <EnhancedButton variant="ghost" size="md">
                  Medium Button
                </EnhancedButton>
                <EnhancedButton variant="ghost" size="lg">
                  Large Button
                </EnhancedButton>
                <EnhancedButton variant="ghost" size="lg" disabled>
                  Disabled Button
                </EnhancedButton>
                <EnhancedButton variant="ghost" size="lg">
                  <Settings size={20} />
                  Settings
                </EnhancedButton>
              </div>
            </motion.div>

            {/* Destructive Button */}
            <motion.div
              className="p-6 rounded-xl bg-gray-900/50 border border-red-500/20 backdrop-blur"
              whileHover={{ y: -5 }}
            >
              <h3 className="text-lg font-semibold mb-4 text-red-400">Destructive</h3>
              <div className="space-y-3 flex flex-col">
                <EnhancedButton variant="destructive" size="sm">
                  Small Button
                </EnhancedButton>
                <EnhancedButton variant="destructive" size="md">
                  Medium Button
                </EnhancedButton>
                <EnhancedButton variant="destructive" size="lg">
                  Large Button
                </EnhancedButton>
                <EnhancedButton variant="destructive" size="lg" disabled>
                  Disabled Button
                </EnhancedButton>
                <EnhancedButton variant="destructive" size="lg">
                  <Trash2 size={20} />
                  Delete
                </EnhancedButton>
              </div>
            </motion.div>

            {/* Icon Button */}
            <motion.div
              className="p-6 rounded-xl bg-gray-900/50 border border-gray-500/20 backdrop-blur"
              whileHover={{ y: -5 }}
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-400">Icon Only</h3>
              <div className="space-y-3 flex flex-col items-start">
                <div className="flex gap-3">
                  <EnhancedButton variant="icon" size="sm">
                    <Heart size={16} />
                  </EnhancedButton>
                  <EnhancedButton variant="icon" size="md">
                    <Settings size={20} />
                  </EnhancedButton>
                  <EnhancedButton variant="icon" size="lg">
                    <Download size={24} />
                  </EnhancedButton>
                </div>
                <div className="flex gap-3 mt-2">
                  <EnhancedButton variant="icon" size="md" disabled>
                    <Heart size={20} />
                  </EnhancedButton>
                  <EnhancedButton
                    variant="icon"
                    size="md"
                    loading={loadingId === 'icon'}
                    onClick={() => {
                      setLoadingId('icon');
                      setTimeout(() => setLoadingId(null), 2000);
                    }}
                  >
                    <Settings size={20} />
                  </EnhancedButton>
                </div>
              </div>
            </motion.div>

            {/* Button Sizes */}
            <motion.div
              className="p-6 rounded-xl bg-gray-900/50 border border-pink-500/20 backdrop-blur"
              whileHover={{ y: -5 }}
            >
              <h3 className="text-lg font-semibold mb-4 text-pink-400">All Sizes</h3>
              <div className="space-y-2 flex flex-col">
                <EnhancedButton variant="primary" size="xs">
                  Extra Small
                </EnhancedButton>
                <EnhancedButton variant="primary" size="sm">
                  Small
                </EnhancedButton>
                <EnhancedButton variant="primary" size="md">
                  Medium
                </EnhancedButton>
                <EnhancedButton variant="primary" size="lg">
                  Large
                </EnhancedButton>
                <EnhancedButton variant="primary" size="xl">
                  Extra Large
                </EnhancedButton>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section className="mb-16" variants={itemVariants}>
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full"></span>
            Button Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              className="p-8 rounded-xl bg-gray-900/50 border border-cyan-500/20 backdrop-blur"
              whileHover={{ y: -5 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-cyan-400">✨ Visual Effects</h3>
              <ul className="space-y-2 text-gray-300">
                <li>✓ Dynamic glow effects on hover</li>
                <li>✓ Smooth ripple animation on click</li>
                <li>✓ Gradient backgrounds with blend modes</li>
                <li>✓ Border glow that responds to mouse position</li>
                <li>✓ Shimmer and pulse animations</li>
                <li>✓ Transform effects on interaction</li>
              </ul>
            </motion.div>

            <motion.div
              className="p-8 rounded-xl bg-gray-900/50 border border-purple-500/20 backdrop-blur"
              whileHover={{ y: -5 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-purple-400">🎮 Interactivity</h3>
              <ul className="space-y-2 text-gray-300">
                <li>✓ Loading state with spinner</li>
                <li>✓ Disabled state with visual feedback</li>
                <li>✓ Icon support with positioning</li>
                <li>✓ Customizable animations</li>
                <li>✓ Keyboard accessible</li>
                <li>✓ Touch-friendly interactions</li>
              </ul>
            </motion.div>

            <motion.div
              className="p-8 rounded-xl bg-gray-900/50 border border-pink-500/20 backdrop-blur"
              whileHover={{ y: -5 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-pink-400">🎨 Customization</h3>
              <ul className="space-y-2 text-gray-300">
                <li>✓ 5+ button variants</li>
                <li>✓ 5 size options</li>
                <li>✓ Custom className support</li>
                <li>✓ Custom styling options</li>
                <li>✓ Polymorphic component</li>
                <li>✓ Type-safe props</li>
              </ul>
            </motion.div>

            <motion.div
              className="p-8 rounded-xl bg-gray-900/50 border border-orange-500/20 backdrop-blur"
              whileHover={{ y: -5 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-orange-400">⚡ Performance</h3>
              <ul className="space-y-2 text-gray-300">
                <li>✓ GPU-accelerated animations</li>
                <li>✓ Reduced motion support</li>
                <li>✓ Optimized re-renders</li>
                <li>✓ Responsive design</li>
                <li>✓ Mobile optimized</li>
                <li>✓ Accessible color contrast</li>
              </ul>
            </motion.div>
          </div>
        </motion.section>

        {/* Integration Examples */}
        <motion.section variants={itemVariants}>
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <span className="inline-block w-2 h-2 bg-pink-400 rounded-full"></span>
            Usage Examples
          </h2>

          <div className="p-8 rounded-xl bg-gray-900/50 border border-gray-500/20 backdrop-blur">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-300">Basic Button</h3>
                <pre className="bg-black/50 p-4 rounded border border-gray-700 text-sm overflow-x-auto">
                  <code>{`<EnhancedButton variant="primary" size="lg">
  Sign In
</EnhancedButton>`}</code>
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-300">Button with Icon</h3>
                <pre className="bg-black/50 p-4 rounded border border-gray-700 text-sm overflow-x-auto">
                  <code>{`<EnhancedButton variant="secondary" size="lg">
  <Download size={20} />
  Download
</EnhancedButton>`}</code>
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-300">Loading State Button</h3>
                <pre className="bg-black/50 p-4 rounded border border-gray-700 text-sm overflow-x-auto">
                  <code>{`<EnhancedButton 
  loading={isLoading} 
  disabled={isLoading}
  onClick={handleSubmit}
>
  {isLoading ? 'Processing...' : 'Submit'}
</EnhancedButton>`}</code>
                </pre>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default UIEnhancementShowcase;
