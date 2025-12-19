import { useMemo } from 'react';

interface StardustProps {
  density?: 'low' | 'medium' | 'high';
}

export function Stardust({ density = 'medium' }: StardustProps) {
  const stars = useMemo(() => {
    const counts = { low: 20, medium: 35, high: 55 };
    const count = counts[density];
    
    return Array.from({ length: count }, (_, i) => {
      const isLarge = Math.random() > 0.7;
      const isMagic = Math.random() > 0.85;
      
      return {
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: isLarge ? Math.random() * 6 + 4 : Math.random() * 3 + 2,
        duration: Math.random() * 4 + 3,
        delay: Math.random() * 5,
        isMagic,
      };
    });
  }, [density]);

  return (
    <div className="stardust-container" aria-hidden="true">
      {stars.map((star) => (
        <div
          key={star.id}
          className={`star ${star.isMagic ? 'star-magic' : ''}`}
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            '--duration': `${star.duration}s`,
            '--delay': `${star.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}