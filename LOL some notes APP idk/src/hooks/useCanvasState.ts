import { Skia } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Dimensions } from 'react-native';
import { ImageAsset, Line, Point } from '../types/canvas';

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
    const [activeTransformZone, setActiveTransformZone] = useState<string | null>(null);

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
        setImages([]);
        setSelectedImageId(null);
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

                const permanentUri = await helperSaveImageToSandbox(imageAsset.uri);
                const rawData = await Skia.Data.fromURI(permanentUri);
                const skiaImage = Skia.Image.MakeImageFromEncoded(rawData);

                if (skiaImage) {
                    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
                    const screenCenterX = screenWidth / 2
                    const screenCenterY = screenHeight / 2

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
                        uri: permanentUri,
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

    const getHitZone = (tapX: number, tapY: number, img: ImageAsset) => {
        const hitLeeway = 15;
        const imaageWidth = img.width * img.scale;
        const imageHeight = img.height * img.scale;

        const centerX = img.x + (imaageWidth / 2);
        const centerY = img.y + (imageHeight / 2);

        const rot = img.rotation || 0;

        const deltaX = tapX - centerX;
        const deltaY = tapY - centerY;

        const unrotatedTapX = centerX + (deltaX * Math.cos(-rot) - deltaY * Math.sin(-rot));
        const unrotatedTapY = centerY + (deltaX * Math.sin(-rot) + deltaY * Math.cos(-rot));

        const left = img.x;
        const right = img.x + imaageWidth;
        const top = img.y;
        const bottom = img.y + imageHeight;

        const rotX = centerX;
        const rotY = top - 30;

        if (Math.abs(unrotatedTapX - rotX) <= hitLeeway && Math.abs(unrotatedTapY - rotY) <= hitLeeway) return "rotationHandle";

        if (Math.abs(unrotatedTapX - left) <= hitLeeway && Math.abs(unrotatedTapY - top) <= hitLeeway) return 'topLeftCorner';
        if (Math.abs(unrotatedTapX - right) <= hitLeeway && Math.abs(unrotatedTapY - top) <= hitLeeway) return 'topRightCorner';
        if (Math.abs(unrotatedTapX - left) <= hitLeeway && Math.abs(unrotatedTapY - bottom) <= hitLeeway) return 'bottomLeftCorner';
        if (Math.abs(unrotatedTapX - right) <= hitLeeway && Math.abs(unrotatedTapY - bottom) <= hitLeeway) return 'bottomRightCorner';

        if (unrotatedTapX >= left && unrotatedTapX <= right && unrotatedTapY >= top && unrotatedTapY <= bottom) return "center";
        return "Miss";
    }

    const handleImageTap = (event: any) => {
        if (event.pointerType !== 0) {
            return;
        }
        const tapX = (event.x - canvasOffsetX) / zoomMultiplier;
        const tapY = (event.y - canvasOffsetY) / zoomMultiplier;

        for (let i = images.length - 1; i >= 0; i--) {
            const img = images[i];
            const hitZone = getHitZone(tapX, tapY, img);

            if (hitZone !== "Miss") {
                console.log("🎯 HIT SUCCESS: You tapped the " + hitZone + " of the image!");
                setSelectedImageId(img.id);
                return;
            }
        }
        console.log("💨 MISS: Tapped empty space.");
        setSelectedImageId(null);
    };

    const handleFingerPanStart = (event: any) => {
        if (event.pointerType !== 0) {
            return;
        }

        const x = (event.x - canvasOffsetX) / zoomMultiplier;
        const y = (event.y - canvasOffsetY) / zoomMultiplier;

        // in the case an image is selected 
        if (selectedImageId) {
            const selectedImg = images.find(img => img.id === selectedImageId);

            if (selectedImg) {
                const hitZone = getHitZone(x, y, selectedImg);

                if (hitZone !== "Miss") {
                    setActiveTransformZone(hitZone);
                }
            }
        }
    }

    const handleFingerPanMove = (event: any) => {
        if (event.pointerType !== 0) return;

        if (activeTransformZone) {
            const deltaX = event.changeX / zoomMultiplier;
            const deltaY = event.changeY / zoomMultiplier;

            setImages((prev) => prev.map((img) => {
                if (img.id !== selectedImageId) return img;

                let newX = img.x;
                let newY = img.y;
                let newScale = img.scale;

                const currentWidth = img.width * img.scale;
                const currentHeight = img.height * img.scale;

                if (activeTransformZone === "center") {
                    newX += deltaX;
                    newY += deltaY;
                }

                else if (activeTransformZone === "bottomRightCorner" ||
                    activeTransformZone === "bottomLeftCorner" ||
                    activeTransformZone === "topRightCorner" ||
                    activeTransformZone === "topLeftCorner"
                ) {
                    const centerX = img.x + (currentWidth / 2);
                    const centerY = img.y + (currentHeight / 2);
                    
                    const fingerX = (event.x - canvasOffsetX) / zoomMultiplier;
                    const fingerY = (event.y - canvasOffsetY) / zoomMultiplier;

                    const fingerDistance = Math.hypot(fingerX - centerX, fingerY - centerY);
                    const unscaledCornerDist = Math.hypot(img.width / 2, img.height / 2);

                    newScale = Math.max(0.1, fingerDistance / unscaledCornerDist);

                    newX = centerX - ((img.width * newScale) / 2);
                    newY = centerY - ((img.height * newScale) / 2);
                }

                else if (activeTransformZone === "rotationHandle") {
                    const currentFingerX = (event.x - canvasOffsetX) / zoomMultiplier;
                    const currentFingerY = (event.y - canvasOffsetY) / zoomMultiplier;
                    
                    const centerX = img.x + (currentWidth / 2);
                    const centerY = img.y + (currentHeight / 2);

                    img.rotation = Math.atan2(currentFingerY - centerY, currentFingerX - centerX) + (Math.PI / 2);
                }
                
                return { ...img, x: newX, y: newY, scale: newScale };
            }));
            return;
        }
        console.log("Pan Deltas:", event.changeX, event.changeY);
        updatePan(event.changeX, event.changeY);
    }

    const handleFingerPanEnd = (event: any) => {
        if (event.pointerType !== 0) return;

        if (activeTransformZone) {
            setActiveTransformZone(null);
        }
    }

    const deleteSelectedImage = () => {
        if (selectedImageId) {
            setImages((prev) => prev.filter(img => img.id !== selectedImageId));
            setSelectedImageId(null);
        }
    }

    const duplicateSelectedImage = () => {
        if (selectedImageId) {
            const imgToDuplicate = images.find(img => img.id === selectedImageId);
            if (imgToDuplicate) {

                const duplicatedImage = {
                    ...imgToDuplicate,
                    id: Date.now().toString(),
                    x: imgToDuplicate.x + 20,
                    y: imgToDuplicate.y + 20
                };
                setImages((prev) => [...prev, duplicatedImage]);
                setSelectedImageId(duplicatedImage.id);
            }
        }
    }

    const helperSaveImageToSandbox = async (tempUri: string) => {
        try {
            const uniqueFileName = `canvas-img-${Date.now()}.jpg`;
            const permanentUri = `${FileSystem.documentDirectory}${uniqueFileName}`;
            await FileSystem.copyAsync({
                from: tempUri,
                to: permanentUri,
            });

            return permanentUri;
        }
        catch (error) {
            console.error("Failed to save image to sandbox:", error);
            return tempUri;
        }
    }

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
        activeTransformZone,
        handleFingerPanStart,
        handleFingerPanMove,
        handleFingerPanEnd,
        deleteSelectedImage,
        duplicateSelectedImage,
    };
};
