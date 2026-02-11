import React, { Suspense, lazy } from 'react';
import { useTheme } from '@/themes/ThemeProvider';
import type { ThemeName } from '@/themes/themeConfig';

const VoidGalaxy = lazy(() => import('@/themes/backgrounds/VoidGalaxy'));
const NebulaStorm = lazy(() => import('@/themes/backgrounds/NebulaStorm'));
const SolarFlare = lazy(() => import('@/themes/backgrounds/SolarFlare'));
const QuantumFrost = lazy(() => import('@/themes/backgrounds/QuantumFrost'));
const CosmicMidnight = lazy(() => import('@/themes/backgrounds/CosmicMidnight'));

const bgMap: Record<ThemeName, React.LazyExoticComponent<React.FC<{ performanceMode?: boolean; reducedMotion?: boolean }>>> = {
  voidGalaxy: VoidGalaxy,
  nebulaStorm: NebulaStorm,
  solarFlare: SolarFlare,
  quantumFrost: QuantumFrost,
  cosmicMidnight: CosmicMidnight,
};

const ThemeBackground: React.FC = () => {
  const { themeName, performanceMode, reducedMotion } = useTheme();
  const BgComponent = bgMap[themeName];

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black -z-10" />}>
      <BgComponent performanceMode={performanceMode} reducedMotion={reducedMotion} />
    </Suspense>
  );
};

export default ThemeBackground;
