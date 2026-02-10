import React from "react";
import { news } from "@shared/news";
import { Link } from "react-router-dom";
import InteractiveCosmicBackground from "@/components/InteractiveCosmicBackground";

const News: React.FC = () => {
  return (
    <main
      id="main"
      className="relative min-h-screen bg-black text-white p-6 max-w-4xl mx-auto"
    >
      <InteractiveCosmicBackground />
      <div className="relative z-20">
        <h1 className="text-3xl font-bold mb-6">News & Updates</h1>
        <ul className="space-y-4">
          {news.map((n) => (
            <li
              key={n.id}
              className="p-4 rounded border border-gray-700 bg-white/5 backdrop-blur-sm"
            >
              <h2 className="text-xl font-semibold">{n.title}</h2>
              <div className="text-xs text-gray-400 mb-2">
                {new Date(n.date).toLocaleString()}
              </div>
              <p className="text-gray-200">{n.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Link className="text-cyan-400 underline" to="/">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
};

export default News;
