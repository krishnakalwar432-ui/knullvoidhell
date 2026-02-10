import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, Clock } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import KnullvoidLogo from '@/components/KnullvoidLogo';

const ComingSoon: React.FC = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <motion.div
          className="text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <KnullvoidLogo className="mb-6 scale-75" />
          </div>
          
          <motion.div
            className="mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <div className="w-24 h-24 mx-auto bg-gradient-to-r from-neon-green to-neon-purple rounded-full flex items-center justify-center mb-6">
              <Clock className="w-12 h-12 text-black" />
            </div>
          </motion.div>
          
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-neon-green via-neon-purple to-neon-pink bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Coming Soon
          </motion.h1>
          
          <motion.p
            className="text-muted-foreground text-lg mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            This game is currently in development. We're working hard to bring you amazing gaming experiences with cutting-edge 3D graphics and mobile optimization.
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Link to="/">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-neon-green to-neon-purple hover:from-neon-purple hover:to-neon-green text-black font-bold"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Games
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10"
            >
              <Zap className="w-4 h-4 mr-2" />
              Get Notified
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ComingSoon;
