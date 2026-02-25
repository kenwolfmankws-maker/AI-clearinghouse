import React from 'react';

interface HeroProps {
  onExplore: () => void;
}

const Hero: React.FC<HeroProps> = ({ onExplore }) => {
  return (
    <div className="relative h-[600px] flex items-center justify-center overflow-hidden mt-16">

      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://d64gsuwffb70l.cloudfront.net/68e97a5d7d08e6d58f40ab97_1760131721182_68739871.webp)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-900"></div>
      </div>
      
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Discover the AI That
          <span className="block bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Powers Tomorrow
          </span>
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Explore, compare, and integrate the world's most powerful AI models. 
          From language to vision, find the perfect AI for your needs.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onExplore}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Explore Models
          </button>
          <button className="px-8 py-4 bg-slate-800/50 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-slate-700/50 transition-all border border-slate-700">
            View Docs
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
