import React from 'react';
import NeonGameInterface from '@/components/NeonGameInterface';
import { games } from '@shared/games';

const Index: React.FC = () => {
  return (
    <NeonGameInterface 
      games={games}
      onGameSelect={(gameId) => {
        console.log('Game selected:', gameId);
      }}
    />
  );
};

export default Index;
