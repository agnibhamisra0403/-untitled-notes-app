import { useState } from 'react';
import { Line, Point } from '../types/canvas';

export const useCanvasState = () => {
    const [currentLine, setCurrentLine] = useState<Line | null>(null);
    const [completedLines, setCompletedLines] = useState<Line[]>([]);
    const [canvasOffsetX, setCanvasOffsetX] = useState<number>(0);
    const [canvasOffsetY, setCanvasOffsetY] = useState<number>(0);

    const updatePan = (changeX: number, changeY: number) => {
        // since we have access to event translation, we can use that to shift the image rather than compute it ourself
        setCanvasOffsetX((prev) => prev + (changeX || 0));
        setCanvasOffsetY((prev) => prev + (changeY || 0));
    }

    const handleGestureStart = (event: any) => {
        if (event.pointerType !== 1) {
            return; // the touch case
        }
        const x = event.x - canvasOffsetX;
        const y = event.y - canvasOffsetY;

        const pressure = event.pressure
        const force = event.force;

        const point: Point = { x, y };

        const newLine: Line = {
            points: [point],
            color: '#00FFFF',
            width: 5,
        };

        setCurrentLine(newLine);
    }

    const handleGestureMove = (event: any) => {
        if (event.pointerType !== 1) return; // Ignore fingers

        const x = event.x - canvasOffsetX;
        const y = event.y - canvasOffsetY;
        const newPoint: Point = { x, y };

        // Use a functional updater (prevLine represents the exact state right now)
        setCurrentLine((prevLine) => {
            if (!prevLine) return null; // Safety check
            
            return {
                ...prevLine,
                points: [...prevLine.points, newPoint] // Safely append the point
            };
        });
    };

    const handleGestureEnd = () => {
        setCurrentLine((prevLine) => {
            if (prevLine) {
                // Use a functional update on completedLines to prevent array race conditions
                setCompletedLines((prevCompleted) => [...prevCompleted, prevLine]);
            }
            return null; // Instantly clears the active workbench
        });
    };

    const clearCanvas = () => {
        setCompletedLines([]);
        setCurrentLine(null);
    };


    return {
        currentLine,
        completedLines,
        canvasOffsetX,
        canvasOffsetY,
        updatePan,
        setCanvasOffsetX,
        setCanvasOffsetY,
        setCompletedLines,
        handleGestureStart,
        handleGestureMove,
        handleGestureEnd,
        clearCanvas,
    };
};
