// src/components/VideoCard.jsx
const VideoCard = () => (
  <div className="group cursor-pointer">
    {/* Light: light gray | Dark: dark gray */}
    <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-xl mb-2 transition-transform group-hover:scale-105" />
    
    <h3 className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">
      NexuStream Concept Reveal
    </h3>
    
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
      Admin • 45K views
    </p>
  </div>
);