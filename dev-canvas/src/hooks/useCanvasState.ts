import { useState } from 'react';
import { Line, Point } from '../types/canvas';

export const useCanvasState = () => {
    const [currentLine, setCurrentLine] = useState<Line | null>(null);
    const [completedLines, setCompletedLines] = useState<Line[]>([]);

    const handleGestureStart = (event: any) => {
        console.log("POINTER TYPE: ", event.pointerType)
        if (event.pointerType !== 1) {
            return; // the touch case
        }
        const x = event.x;
        const y = event.y;

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

        const x = event.x;
        const y = event.y;
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

    // const handleTouchStart = (event: GestureResponderEvent) => {
    //     // console.log("WHAT THE HARDWARE SEES:", (event.nativeEvent as any).touchType);
    //     // if ((event.nativeEvent as any).touchType !== 'stylus') {
    //     //     return;
    //     // }

    //     const x = event.nativeEvent.locationX;
    //     const y = event.nativeEvent.locationY;

    //     const point: Point = { x, y };

    //     const newLine: Line = {
    //         points: [point],
    //         color: '#00FFFF',
    //         width: 5,
    //     };
    //     setCurrentLine(newLine);

    // };

    // const handleTouchMove = (event: GestureResponderEvent) => {
    //     // console.log("WHAT THE HARDWARE SEES:", (event.nativeEvent as any).touchType);
    //     // if ((event.nativeEvent as any).touchType !== 'stylus') {
    //     //     return;
    //     // }

    //     if (!currentLine) return;

    //     const x = event.nativeEvent.locationX;
    //     const y = event.nativeEvent.locationY;

    //     const newPoint: Point = {x, y};
    //     const updatedLine: Line = {...currentLine, points: [...currentLine.points, newPoint]};

    //     setCurrentLine(updatedLine);

    // };

    // const handleTouchEnd = () => {
    //     if (!currentLine) return;
    //     setCompletedLines([...completedLines, currentLine]);
    //     setCurrentLine(null);
    // };

    const clearCanvas = () => {
        setCompletedLines([]);
        setCurrentLine(null);
    };


    return {
        currentLine,
        completedLines,
        setCompletedLines,
        handleGestureStart,
        handleGestureMove,
        handleGestureEnd,
        clearCanvas,
    };
};
