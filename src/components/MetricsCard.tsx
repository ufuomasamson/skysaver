"use client";
import { useEffect, useState } from 'react';

interface MetricsCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  delay?: number;
  formatValue?: (value: number | string) => string;
}

export default function MetricsCard({ 
  title, 
  value, 
  icon, 
  color, 
  delay = 0, 
  formatValue 
}: MetricsCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      if (typeof value === 'number') {
        // Animate number from 0 to target value
        const duration = 1500;
        const steps = 60;
        const increment = value / steps;
        let current = 0;
        
        const interval = setInterval(() => {
          current += increment;
          if (current >= value) {
            current = value;
            clearInterval(interval);
          }
          setAnimatedValue(Math.floor(current));
        }, duration / steps);
        
        return () => clearInterval(interval);
      } else {
        setAnimatedValue(value as any);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  const displayValue = formatValue 
    ? formatValue(animatedValue) 
    : typeof value === 'number' 
      ? animatedValue.toLocaleString()
      : animatedValue;

  return (
    <div 
      className={`relative min-w-[180px] flex-1 flex flex-col gap-3 rounded-xl p-6 bg-gradient-to-br ${color} shadow-lg transform transition-all duration-700 hover:scale-105 hover:shadow-xl ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Background Stars Pattern */}
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <div className="absolute top-2 left-4 w-1 h-1 bg-white/30 rounded-full animate-pulse"></div>
        <div className="absolute top-6 right-6 w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-8 left-8 w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-4 right-4 w-1 h-1 bg-white/35 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-2 w-0.5 h-0.5 bg-white/25 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-8 right-12 w-0.5 h-0.5 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }}></div>
      </div>

      {/* Animated Star Burst */}
      <div className="absolute top-4 right-4">
        <div className={`text-2xl transform transition-all duration-1000 ${isVisible ? 'rotate-0 scale-100' : 'rotate-180 scale-0'}`}>
          ⭐
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{icon}</span>
          <h3 className="text-white/90 text-sm font-medium uppercase tracking-wide">
            {title}
          </h3>
        </div>
        
        <div className={`text-white text-3xl font-bold transition-all duration-1000 ${
          isVisible ? 'transform-none' : 'transform scale-50'
        }`}>
          {displayValue}
        </div>
      </div>

      {/* Glowing Border Effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Shooting Star Animation */}
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <div className={`absolute w-16 h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent transform -rotate-45 transition-all duration-2000 ${
          isVisible ? 'translate-x-full translate-y-full' : '-translate-x-full -translate-y-full'
        }`} style={{ top: '20%', left: '-100%', transitionDelay: `${delay + 500}ms` }}></div>
      </div>
    </div>
  );
}
