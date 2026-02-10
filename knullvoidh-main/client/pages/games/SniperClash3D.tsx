import GameLayout from '@/components/GameLayout';

const SniperClash3D = () => {
  return (
    <GameLayout gameTitle="Sniper Clash 3D" gameCategory="3D sniper combat">
      <div className="flex flex-col items-center gap-4">
        <canvas width={800} height={600} className="border border-gray-600 bg-black rounded-lg" />
        <p className="text-gray-300">Mouse: Aim | Click: Shoot</p>
      </div>
    </GameLayout>
  );
};

export default SniperClash3D;
