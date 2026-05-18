import { useState } from 'react';
import { GestureResponderEvent } from 'react-native';
import { Line, Point } from '../types/canvas';

export const useCanvasState = () => {
    const [currentLine, setCurrentLine] = useState<Line | null>(null);
    const [completedLines, setCompletedLines] = useState<Line[]>([]);


    const handleTouchStart = (event: GestureResponderEvent) => {
        const x = event.nativeEvent.locationX;
        const y = event.nativeEvent.locationY;

        const point: Point = { x, y };

        const newLine: Line = {
            points: [point],
            color: '#00FFFF',
            width: 5,
        };

        setCurrentLine(newLine);
    };

    const handleTouchMove = (event: GestureResponderEvent) => {
        if (!currentLine) return;

        const x = event.nativeEvent.locationX;
        const y = event.nativeEvent.locationY;
        
        const newPoint: Point = {x, y};
        const updatedLine: Line = {...currentLine, points: [...currentLine.points, newPoint]};
        
        setCurrentLine(updatedLine);

    };
    
    const handleTouchEnd = () => {
        if (!currentLine) return;
        setCompletedLines([...completedLines, currentLine]);
        setCurrentLine(null);
    };

    const clearCanvas = () => {
        setCompletedLines([]);
        setCurrentLine(null);
    };
    

    return {
        currentLine,
        completedLines,
        setCompletedLines,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        clearCanvas,
    };
};
