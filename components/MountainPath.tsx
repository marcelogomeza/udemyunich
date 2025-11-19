
import React from 'react';
import { Course } from '../types';

interface MountainPathProps {
  courses: Course[];
}

const MountainPath: React.FC<MountainPathProps> = ({ courses }) => {
  // Determine climber position
  // If all completed, climber is at top. If none, at bottom.
  // Else, climber is at the index of the first uncompleted course (or the one currently in progress)
  
  let climberIndex = -1;
  for (let i = 0; i < courses.length; i++) {
    if (courses[i].isCompleted) {
        climberIndex = i;
    } else {
        break;
    }
  }
  // If user is working on the next course, visually place them there but indicate progress?
  // The prompt says "avanzar hasta el punto donde está el último curso completado".
  // Let's put the climber ON the node of the last completed course, or at start if none.
  
  const totalNodes = courses.length;
  const containerHeight = 600;
  
  return (
    <div className="relative w-full h-[600px] overflow-hidden rounded-xl shadow-lg border-4 border-white bg-sky-300">
        {/* Background: Sky and Mountain */}
        {/* Mountain Cliff Side */}
        <div className="absolute right-0 top-0 h-full w-2/3 bg-[#5a626e]" style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)' }}>
            {/* Texture details */}
            <div className="absolute top-20 left-10 w-full h-2 bg-black/10 rotate-3 transform"></div>
            <div className="absolute top-60 left-0 w-full h-2 bg-black/10 -rotate-2 transform"></div>
            <div className="absolute bottom-40 left-20 w-full h-2 bg-black/10 rotate-6 transform"></div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/2 bg-[#4b5563] opacity-50" style={{ clipPath: 'polygon(40% 0, 100% 0, 100% 100%, 10% 100%)' }}></div>
        
        {/* Clouds */}
        <div className="absolute top-10 left-10 bg-white/80 w-24 h-6 rounded-full blur-md opacity-80"></div>
        <div className="absolute top-32 left-1/4 bg-white/80 w-32 h-8 rounded-full blur-md opacity-60"></div>
        
        {/* Bottom mountains landscape */}
        <div className="absolute bottom-0 left-0 w-full h-32 z-10">
             <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,150 L150,50 L300,150 Z" fill="#374151" />
                <path d="M200,150 L350,20 L500,150 Z" fill="#4b5563" />
                <path d="M-50,150 L50,80 L150,150 Z" fill="#1f2937" />
                {/* Trees */}
                <path d="M20,150 L40,100 L60,150 Z" fill="#166534" />
                <path d="M30,150 L50,90 L70,150 Z" fill="#14532d" />
             </svg>
        </div>

        {/* The Rope Path */}
        <div className="absolute inset-0 z-20">
            {courses.map((course, index) => {
                // Calculate positions vertically
                // Bottom is index 0? No, course 1 is usually start.
                // Let's assume Course 1 is at bottom, Course N is at top.
                const progress = index / (totalNodes - 1 || 1);
                const yPos = 500 - (progress * 400); // 500px (bottom) to 100px (top)
                const xPos = 280 + (Math.sin(index * 2) * 20); // Slight wiggle around right side

                const nextProgress = (index + 1) / (totalNodes - 1 || 1);
                const nextY = 500 - (nextProgress * 400);
                const nextX = 280 + (Math.sin((index + 1) * 2) * 20);

                const isCompleted = index <= climberIndex;
                const isNext = index === climberIndex + 1;

                return (
                    <React.Fragment key={course.id}>
                        {/* Rope Segment to next node */}
                        {index < totalNodes - 1 && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                                <line 
                                    x1={xPos} y1={yPos} 
                                    x2={nextX} y2={nextY} 
                                    stroke={index < climberIndex ? "#a3e635" : "#9ca3af"} 
                                    strokeWidth="3"
                                    strokeDasharray={index < climberIndex ? "0" : "5 3"}
                                />
                            </svg>
                        )}
                        
                        {/* Node */}
                        <div 
                            className="absolute w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                            style={{ left: xPos, top: yPos }}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-md z-30 ${
                                isCompleted ? 'bg-lime-500 border-white' : 
                                isNext ? 'bg-yellow-400 border-white animate-pulse' : 'bg-gray-300 border-gray-400'
                            }`}>
                                {isCompleted && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            
                            {/* Climber - Positioned at the active node */}
                            {index === climberIndex && (
                                <div className="absolute -right-8 bottom-0 transition-all duration-1000">
                                    <img 
                                        src="https://cdn-icons-png.flaticon.com/512/3050/3050468.png" 
                                        alt="climber" 
                                        className="w-10 h-10 drop-shadow-lg"
                                    />
                                </div>
                            )}
                             {/* Start Position Climber (Index -1) */}
                             {climberIndex === -1 && index === 0 && (
                                <div className="absolute -right-8 top-8 transition-all duration-1000">
                                    <img 
                                        src="https://cdn-icons-png.flaticon.com/512/3050/3050468.png" 
                                        alt="climber" 
                                        className="w-10 h-10 drop-shadow-lg opacity-50"
                                    />
                                </div>
                            )}
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    </div>
  );
};

export default MountainPath;
