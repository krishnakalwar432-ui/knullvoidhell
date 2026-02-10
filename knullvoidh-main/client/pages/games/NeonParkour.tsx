import GameLayout from '@/components/GameLayout';

const NeonParkour = () => {
  return (
    <GameLayout gameTitle="Neon Parkour" gameCategory="Platform">
      <div className="flex flex-col items-center gap-4">
        <canvas width={800} height={600} className="border border-gray-600 bg-black rounded-lg" />
        <p className="text-gray-300">WASD: Run | Space: Jump</p>
      </div>
    </GameLayout>
  );
};

export default NeonParkour;
