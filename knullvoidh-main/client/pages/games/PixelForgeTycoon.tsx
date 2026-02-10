import React, { useEffect, useState } from 'react';
import GameLayout from '@/components/GameLayout';

interface Upgrade { id: string; name: string; cost: number; rate: number }

const initialUpgrades: Upgrade[] = [
  { id: 'intern', name: 'Hire Intern', cost: 50, rate: 0.5 },
  { id: 'dev', name: 'Junior Dev', cost: 200, rate: 2 },
  { id: 'artist', name: 'Pixel Artist', cost: 500, rate: 5 },
  { id: 'engine', name: 'Render Engine', cost: 1200, rate: 12 },
  { id: 'studio', name: 'Studio Expansion', cost: 5000, rate: 60 }
];

const PixelForgeTycoon: React.FC = () => {
  const [pixels, setPixels] = useState(0);
  const [rate, setRate] = useState(0);
  const [owned, setOwned] = useState<Record<string, number>>({});

  useEffect(() => {
    const id = setInterval(() => {
      setPixels(p => p + rate / 10);
    }, 100);
    return () => clearInterval(id);
  }, [rate]);

  const buy = (u: Upgrade) => {
    if (pixels < u.cost) return;
    setPixels(p => p - u.cost);
    setOwned(o => ({ ...o, [u.id]: (o[u.id] || 0) + 1 }));
    setRate(r => r + u.rate);
  };

  return (
    <GameLayout gameTitle="Pixel Forge Tycoon" gameCategory="Simulation" score={Math.floor(pixels)}>
      <div className="max-w-3xl mx-auto p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 rounded-lg border border-emerald-400/30 bg-black/40">
            <div className="text-3xl font-bold text-emerald-300">{Math.floor(pixels).toLocaleString()} px</div>
            <div className="text-emerald-400/80">Rate: {rate.toFixed(1)} px/s</div>
            <button
              onClick={() => setPixels(p => p + 1)}
              className="mt-4 px-4 py-2 rounded bg-emerald-600/20 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-600/30"
            >
              Forge Pixels
            </button>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {initialUpgrades.map(u => (
                <button key={u.id} onClick={() => buy(u)}
                  className="p-3 rounded border border-emerald-400/30 bg-black/30 hover:border-emerald-300/60 text-left">
                  <div className="flex justify-between">
                    <span className="font-medium text-emerald-200">{u.name}</span>
                    <span className="text-emerald-300">{u.cost} px</span>
                  </div>
                  <div className="text-emerald-400/70 text-sm">+{u.rate} px/s</div>
                  <div className="text-emerald-500/70 text-xs mt-1">Owned: {owned[u.id] || 0}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-lg border border-emerald-400/30 bg-black/40">
            <div className="text-emerald-300 font-semibold mb-2">Studio Status</div>
            <ul className="space-y-1 text-emerald-200/80 text-sm">
              <li>Staff: {(owned['intern']||0)+(owned['dev']||0)+(owned['artist']||0)}</li>
              <li>Engines: {owned['engine']||0}</li>
              <li>Offices: {owned['studio']||0}</li>
            </ul>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default PixelForgeTycoon;
