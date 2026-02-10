import GameLayout from '@/components/GameLayout';

const SpaceRally = () => {
  return (
    <GameLayout gameTitle="Space Rally" gameCategory="Racing">
      <div className="flex flex-col items-center gap-4">
        <canvas width={800} height={600} className="border border-gray-600 bg-black rounded-lg" />
        <p className="text-gray-300">WASD: Navigate | R: Reset</p>
      </div>
    </GameLayout>
  );
};

export default SpaceRally;
