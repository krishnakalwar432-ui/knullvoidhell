export type NewsItem = { id: string; title: string; body: string; date: string };

export const news: NewsItem[] = [
  { id: 'launch-logos', title: 'New KNULLVOID Logos', body: 'We introduced a dynamic wordmark and a glowing tree crest for our new identity.', date: new Date().toISOString() },
  { id: 'new-games', title: 'Six New Games Added', body: 'Play Neon Drift Overdrive, Shadow Bot Protocol, Cyber Strike Arena, Pixel Forge Tycoon, Astral Leap, and Firewall Runner now!', date: new Date().toISOString() }
];
