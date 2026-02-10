import GameLayout from '@/components/GameLayout';

const CombatReloaded = () => {
  return (
    <GameLayout gameTitle="Combat Reloaded" gameCategory="Arena FPS">
      <div className="flex flex-col items-center gap-4">
        <canvas width={800} height={600} className="border border-gray-600 bg-black rounded-lg" />
        <p className="text-gray-300">WASD: Move | Mouse: Aim/Shoot</p>
      </div>
    </GameLayout>
  );
};

export default CombatReloaded;
