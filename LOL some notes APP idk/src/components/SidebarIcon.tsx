import React from 'react';
import Svg, { Rect, Line, Path } from 'react-native-svg';

interface SidebarIconProps {
  color: string;
  size?: number;
}

export const SidebarIcon = ({ color, size = 24 }: SidebarIconProps) => {
  return (
    <Svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth={2.5} // Slightly thicker to match your reference image
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* Outer rounded square */}
      <Rect x="3" y="3" width="18" height="18" rx="4" />
      
      {/* Vertical divider line (roughly 1/3 of the way from the left) */}
      <Line x1="9" y1="3" x2="9" y2="21" />
      
      {/* Left-facing chevron nestled in the left pane */}
      <Path d="M 7 15 L 4 12 L 7 9" />
    </Svg>
  );
};