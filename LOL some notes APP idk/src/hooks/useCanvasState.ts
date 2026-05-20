import { useState } from 'react';
import { Line, Point } from '../types/canvas';

export const useCanvasState = () => {
    // stroking
    const [currentLine, setCurrentLine] = useState<Line | null>(null);
    const [completedLines, setCompletedLines] = useState<Line[]>([]);

    // panning
    const [canvasOffsetX, setCanvasOffsetX] = useState<number>(0);
    const [canvasOffsetY, setCanvasOffsetY] = useState<number>(0);

    // zooming
    const [zoomMultiplier, setZoomMultiplier] = useState<number>(1);

    //eraser
    const [isEraserActive, setIsEraserActive] = useState<boolean>(false);
    const [eraserPosition, setEraserPosition] = useState<Point | null>(null);

// helper functions

    // this is a simple function that toggles the eraser mode on and off
    const toggleEraserActive = () => {
        setIsEraserActive((prev) => !prev);
    }

    // this is the main function that is responsible for the panning of the canvas
    const updatePan = (changeX: number, changeY: number) => {
        // since we have access to event translation, we can use that to shift the image rather than compute it ourself
        setCanvasOffsetX((prev) => prev + (changeX || 0));
        setCanvasOffsetY((prev) => prev + (changeY || 0));
    }

    // this is the main function that handles the start of a gesture - either a pan or a stroke
    const handleGestureStart = (event: any) => {
        if (event.pointerType !== 1) {
            return; // the touch case
        }
        const x = (event.x - canvasOffsetX) / zoomMultiplier;
        const y = (event.y - canvasOffsetY) / zoomMultiplier;

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

    // this is the main function that handles the movement during a gesture - either a pan or a stroke
    const handleGestureMove = (event: any) => {
        
        if (event.pointerType !== 1) return; // Ignore fingers

        const x = (event.x - canvasOffsetX) / zoomMultiplier;
        const y = (event.y - canvasOffsetY) / zoomMultiplier;
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

    // this is the main function that handles the end of a gesture - either a pan or a stroke
    const handleGestureEnd = () => {
        setCurrentLine((prevLine) => {
            if (prevLine && prevLine.points.length > 0) {
                const xs = prevLine.points.map(p => p.x);
                const ys = prevLine.points.map(p => p.y);
                const bounds = {
                    minX: Math.min(...xs),
                    maxX: Math.max(...xs),
                    minY: Math.min(...ys),
                    maxY: Math.max(...ys),
                };

                const lineWithBounds: Line = { ...prevLine, bounds };
                setCompletedLines((prev) => [...prev, lineWithBounds]);
                
            }
            return null;
        });
    };

    // this is the main function that handles the zoom update of the canvas
    const handleZoomUpdate = (scaleDelta: number) => {
        setZoomMultiplier((prev) => prev * scaleDelta);
    }

    const clearCanvas = () => {
        setCompletedLines([]);
        setCurrentLine(null);
    };

    const handleEraserStart = (event: any) => {
        const eraserX = (event.x - canvasOffsetX) / zoomMultiplier;
        const eraserY = (event.y - canvasOffsetY) / zoomMultiplier;
        const radius = 20;

        setEraserPosition({ x: eraserX, y: eraserY });

        setCompletedLines((prev) => {
            const filtered = prev.filter((line) => {
                if (!line.bounds) return true;
                if (eraserX < line.bounds.minX - radius || eraserX > line.bounds.maxX + radius ||
                    eraserY < line.bounds.minY - radius || eraserY > line.bounds.maxY + radius) {
                    return true;
                }
                const isHit = line.points.some(p => Math.sqrt(Math.pow(p.x - eraserX, 2) + Math.pow(p.y - eraserY, 2)) < radius);
                return !isHit;
            });
            if (filtered.length === prev.length) {
                return prev;
            }
            return filtered;
        });

    }

    const handleEraserMove = (event: any) => {
        const eraserX = (event.x - canvasOffsetX) / zoomMultiplier;
        const eraserY = (event.y - canvasOffsetY) / zoomMultiplier;
        const radius = 20;

        setEraserPosition({ x: eraserX, y: eraserY });

        setCompletedLines((prev) => {
            const filtered = prev.filter((line) => {
                if (!line.bounds) return true;
                if (eraserX < line.bounds.minX - radius || eraserX > line.bounds.maxX + radius ||
                    eraserY < line.bounds.minY - radius || eraserY > line.bounds.maxY + radius) {
                    return true;
                }
                const isHit = line.points.some(p => Math.sqrt(Math.pow(p.x - eraserX, 2) + Math.pow(p.y - eraserY, 2)) < radius);
                return !isHit;
            });
            if (filtered.length === prev.length) {
                return prev;
            }
            return filtered;
        });

    }

    const handleEraserEnd = () => {
        setEraserPosition(null);
        
    }


    return {
        currentLine,
        completedLines,
        canvasOffsetX,
        canvasOffsetY,
        zoomMultiplier,
        isEraserActive,
        eraserPosition,
        setEraserPosition,
        toggleEraserActive,
        updatePan,
        setCanvasOffsetX,
        setCanvasOffsetY,
        setCompletedLines,
        handleGestureStart,
        handleGestureMove,
        handleGestureEnd,
        handleZoomUpdate,
        clearCanvas,
        handleEraserStart,
        handleEraserMove,
        handleEraserEnd
    };
};
