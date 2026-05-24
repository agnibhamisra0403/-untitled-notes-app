import { useState } from 'react';
import { Line, Point } from '../types/canvas';
import * as ImagePicker from 'expo-image-picker';
import { ImageAsset } from '../types/canvas';
import { Skia } from '@shopify/react-native-skia';
import { Dimensions } from 'react-native';

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

    //image
    const [images, setImages] = useState<ImageAsset[]>([]);
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

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

    const handleAddImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1, 
        });

        if (!result.canceled) {
            const imageAsset = result.assets[0];
            
            // TODO: Convert this URI for Skia and save it to state
            try {
                const rawData = await Skia.Data.fromURI(imageAsset.uri);
                const skiaImage = Skia.Image.MakeImageFromEncoded(rawData);
                
                if (skiaImage) {
                    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
                    const screenCenterX = screenWidth/2
                    const screenCenterY = screenHeight/2
                    
                    const realCenterX = (screenCenterX - canvasOffsetX) / zoomMultiplier;
                    const realCenterY = (screenCenterY - canvasOffsetY) / zoomMultiplier;
                    
                    const newAsset: ImageAsset = {
                        id: Date.now().toString(),
                        x: realCenterX - (imageAsset.width / 8),
                        y: realCenterY - (imageAsset.height / 8),
                        width: imageAsset.width / 4,
                        height: imageAsset.height / 4,
                        rotation: 0,
                        scale: 1,
                        image: skiaImage,
                    }

                    setImages((prev) => [...prev, newAsset]);
                    console.log("image successfully compiled and added to state");
                }
            } catch (error) {
                console.error("failed to decode image: ", error);
            }
        }
    }

    const handleImageTap = (event: any) => {
        if (event.pointerType !== 0) {
            return;
        }
        const tapX = (event.x - canvasOffsetX) / zoomMultiplier;
        const tapY = (event.y - canvasOffsetY) / zoomMultiplier;

        for (let i = images.length - 1; i >= 0; i--) {
            const img = images[i];
            if (tapX >= img.x && 
                tapX <= img.x + (img.width * img.scale) &&
                tapY >= img.y && 
                tapY <= img.y + (img.height * img.scale)) {
                    setSelectedImageId(img.id);
                    return;
                }
        }
        setSelectedImageId(null);
    };


    return {
        currentLine,
        completedLines,
        canvasOffsetX,
        canvasOffsetY,
        zoomMultiplier,
        isEraserActive,
        eraserPosition,
        images,
        selectedImageId,
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
        handleEraserEnd,
        handleAddImage,
        setImages,
        setSelectedImageId,
        handleImageTap,
    };
};
