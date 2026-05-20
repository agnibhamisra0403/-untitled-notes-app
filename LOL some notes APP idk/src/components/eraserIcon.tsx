import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface EraserIconProps {
  color: string;
  size?: number;
}

export const EraserIcon = ({ color, size = 24 }: EraserIconProps) => {
  return (
    <Svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth={2} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* ✨ NEW: The Filled Bottom (The Rubber)
        This path traces only the bottom half of the eraser (from the middle line down)
        and explicitly sets fill={color} so it becomes a solid block of color.
      */}
      <Path 
        d="M 6 13 H 18 V 17 A 3 3 0 0 1 15 20 H 9 A 3 3 0 0 1 6 17 Z" 
        fill={color} 
      />

      {/* The main outer body of the block eraser (The outline) */}
      <Path d="M 6 4 H 18 V 17 A 3 3 0 0 1 15 20 H 9 A 3 3 0 0 1 6 17 Z" />
      
      {/* The horizontal dividing line */}
      <Path d="M 6 13 H 18" />
    </Svg>
  );
};