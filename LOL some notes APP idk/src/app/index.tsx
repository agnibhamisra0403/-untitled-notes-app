import { Canvas, Path, Skia, Group, Circle, Image, Rect } from '@shopify/react-native-skia';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRef, useState } from 'react';
import { Gesture, GestureDetector, GestureHandlerRootView, GestureUpdateEvent, PanGestureHandlerEventPayload, PanGestureChangeEventPayload } from 'react-native-gesture-handler';
import { useCanvasState } from '../hooks/useCanvasState';
import { Point } from '../types/canvas';
import { Ionicons } from '@expo/vector-icons';
import { EraserIcon } from '../components/eraserIcon';
import {SidebarIcon} from '../components/SidebarIcon';

let eraserMode = false;

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
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
  } = useCanvasState();

  // handler for panning/drawing gestures
  const pencilPanGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onStart((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      console.log("pointer type", event.pointerType);
      console.log("number of pointers", event.numberOfPointers);
      if (event.pointerType === 0) {
        // finger pan case, we need to update canvas offset here - in this case there is no end position, so we do the update here instead of onEnd
      }
      else if (event.pointerType === 1) {
        setSelectedImageId(null);
        if (isEraserActive) {
          handleEraserStart(event);
        }
        if (!isEraserActive) {
          handleGestureStart(event);
        };
      }
    })
    .onChange((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      console.log("pointer type", event.pointerType);
      console.log("number of pointers", event.numberOfPointers);
      if (event.pointerType === 0) {
        // finger pan case
        console.log("Pan Deltas:", event.changeX, event.changeY);
        updatePan(event.changeX, event.changeY);
      }
      else if (event.pointerType === 1) {
        if (isEraserActive) {
          handleEraserMove(event);
        };
        if (!isEraserActive) {
          handleGestureMove(event);
        };

      }
    })
    .onEnd((event) => {
      if (isEraserActive) {
        handleEraserEnd()
      }
      else {
        handleGestureEnd();
      }
    });

  // variables for pinch/zoom
  const previousFocal = useRef({ x: 0, y: 0 });
  // handler for canvas pinch/zoom gesture
  const canvasPinchGesture = Gesture.Pinch()
    .runOnJS(true)
    .onStart((event) => {
      previousFocal.current = { x: event.focalX, y: event.focalY };
    })
    .onChange((event) => {
      const scaleDelta = event.scaleChange;
      handleZoomUpdate(scaleDelta);

      // need to update the canvas offset to keep the focal point of the pinch gesture at the same location on the screen even after the pinch/zoom occurs
      const panX = event.focalX - previousFocal.current.x;
      const panY = event.focalY - previousFocal.current.y;

      // calculate the focal point drift to reverse the effect of zoom - allows the content to grow outwards from the focal point rather than the top-left corner
      const zoomDriftX = (event.focalX - canvasOffsetX) * (1 - scaleDelta);
      const zoomDriftY = (event.focalY - canvasOffsetY) * (1 - scaleDelta);

      // add both of the above together to get the total change in canvas offset
      const totalChangeX = panX + zoomDriftX;
      const totalChangeY = panY + zoomDriftY;

      updatePan(totalChangeX, totalChangeY);
      previousFocal.current = { x: event.focalX, y: event.focalY };
    });

    const imageTapGesture = Gesture.Tap()
      .runOnJS(true)
      .onEnd(event => {
        handleImageTap(event);
      })

  const simultanousGestures = Gesture.Simultaneous(pencilPanGesture, canvasPinchGesture, imageTapGesture);

  console.log(
    `Active Points: ${currentLine?.points.length || 0} | Total Lines Saved: ${completedLines.length}\n`
  );

     

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Canvas style={styles.canvas}>
          <Group transform={[{ translateX: canvasOffsetX }, { translateY: canvasOffsetY }, { scale: zoomMultiplier }]}>

            {images && images.map((img) => (
              <Group key={img.id}>

                {/* The Actual Image */}
                <Image
                  image={img.image}
                  x={img.x}
                  y={img.y}
                  width={img.width * img.scale}
                  height={img.height * img.scale}
                />

                {/* The Selection Box (Only shows if this image is selected) */}
                {selectedImageId === img.id && (
                  <Group>
                    <Rect
                      x={img.x}
                      y={img.y}
                      width={img.width * img.scale}
                      height={img.height * img.scale}
                      color="#0A84FF"
                      style="stroke"
                      strokeWidth={2}
                    />

                    {/* resizing corners */}
                    {/* Top Left */}
                    <Rect x={img.x - 6} y={img.y - 6} width={12} height={12} color="#FFFFFF" style="fill" />
                    <Rect x={img.x - 6} y={img.y - 6} width={12} height={12} color="#0A84FF" style="stroke" strokeWidth={2} />

                    {/* Top Right */}
                    <Rect x={(img.x + (img.width * img.scale)) - 6} y={img.y - 6} width={12} height={12} color="#FFFFFF" style="fill" />
                    <Rect x={(img.x + (img.width * img.scale)) - 6} y={img.y - 6} width={12} height={12} color="#0A84FF" style="stroke" strokeWidth={2} />

                    {/* Bottom Right */}
                    <Rect x={(img.x + (img.width * img.scale)) - 6} y={(img.y + (img.height * img.scale)) - 6} width={12} height={12} color="#FFFFFF" style="fill" />
                    <Rect x={(img.x + (img.width * img.scale)) - 6} y={(img.y + (img.height * img.scale)) - 6} width={12} height={12} color="#0A84FF" style="stroke" strokeWidth={2} />

                    {/* Bottom Left */}
                    <Rect x={img.x - 6} y={(img.y + (img.height * img.scale)) - 6} width={12} height={12} color="#FFFFFF" style="fill" />
                    <Rect x={img.x - 6} y={(img.y + (img.height * img.scale)) - 6} width={12} height={12} color="#0A84FF" style="stroke" strokeWidth={2} />
                  </Group>
                )}
              </Group>
            ))}

            {/* for all the completed lines in the array */}
            {completedLines.map((line, index) => {
              const path = Skia.Path.Make(); // create a new path for each completed line

              // for each point in the completed line, add it to the path
              line.points.forEach((point: Point, pointIndex: number) => {
                if (pointIndex == 0) {
                  path.moveTo(point.x, point.y) // if the first point, just move to it
                } else {
                  path.lineTo(point.x, point.y) // if not the first point, draw a line to it
                }
              });
              return (
                // return the created path with the specified properties
                <Path
                  key={index}
                  path={path}
                  color={line.color || '#00FFFF'} // Falls back to cyan if empty
                  strokeWidth={line.width || 4}     // Falls back to thickness 4
                  style="stroke"
                  strokeCap="round"
                  strokeJoin="round"
                />
              );
            })}

            {/* Displaying the active line that is being drawn right now */}
            {currentLine && (() => {
              const activePath = Skia.Path.Make(); // create a new path for the active line

              // for all the points in the active line, add it to the path
              currentLine.points.forEach((p: Point, i: number) => {
                if (i == 0) {
                  activePath.moveTo(p.x, p.y)
                } else {
                  activePath.lineTo(p.x, p.y)
                }
              })

              // return the active line with the specified properties in the form of a path
              return (
                <Path
                  key={"active"}
                  path={activePath}
                  color={currentLine.color}
                  strokeWidth={currentLine.width}
                  style="stroke"
                  strokeCap="round"
                  strokeJoin="round"
                />
              )
            })()}

            {isEraserActive && eraserPosition && (
              <Circle
                cx={eraserPosition.x}
                cy={eraserPosition.y}
                r={20}
                color="#A0A0A0"
                style="stroke"
                strokeWidth={2}
              />
            )}

          </Group>
        </Canvas>

        <GestureDetector gesture={simultanousGestures}>
          <Animated.View style={StyleSheet.absoluteFill}/>
        </GestureDetector>

        
        {isMenuOpen && (
          <View style={styles.sidebarDrawer}>

            <View style={styles.sidebarContent}>
              {/* Share Button */}
              <Pressable 
                style={styles.sidebarItem} 
                onPress={() => console.log("Share clicked")}
              >
                <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                <Text style={styles.sidebarText}>Share</Text>
              </Pressable>

              <View style={styles.menuDivider} />

              {/* Export Button */}
              <Pressable 
                style={styles.sidebarItem} 
                onPress={() => console.log("Export clicked")}
              >
                <Ionicons name="download-outline" size={24} color="#FFFFFF" />
                <Text style={styles.sidebarText}>Export</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Pressable
          style={styles.menuButton}
          onPress={() => setIsMenuOpen(!isMenuOpen)}
        >
          <SidebarIcon color={isMenuOpen ? '#0A84FF' : '#FFFFFF'} size={26} />
        </Pressable>

        {/* THE FLOATING CENTRAL TOOLBAR */}
        <View style={styles.toolbarContainer}>
          {/* Pen Tool */}
          <Pressable
            style={[styles.toolButton, !isEraserActive && styles.activeTool]}
            onPress={() => isEraserActive && toggleEraserActive()}
          >
            <Ionicons name="pencil" size={24} color={!isEraserActive ? '#FFFFFF' : '#A0A0A0'} />
          </Pressable>

          {/* Eraser Tool */}
          <Pressable
            style={[styles.toolButton, isEraserActive && styles.activeTool]}
            onPress={() => !isEraserActive && toggleEraserActive()}
          >
            <EraserIcon color={isEraserActive ? '#FFFFFF' : '#A0A0A0'} size={24} />
          </Pressable>

          {/* Image */}
          <Pressable
            style={styles.toolButton}
            onPress={handleAddImage}
          >
            <Ionicons name="image-outline" size={24} color="#FFFFFF" />
          </Pressable>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Clear Canvas Action */}
          <Pressable style={styles.actionButton} onPress={clearCanvas}>
            <Ionicons name="trash-outline" size={24} color="#FF453A" />
          </Pressable>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E', // Apple's native dark mode background
  },
  canvas: {
    flex: 1,
  },

  toolbarContainer: {
    position: 'absolute',
    top: 60, 
    alignSelf: 'center', 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E', 
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,

    // Drop Shadow for 3D elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8, // For Android shadow support
  },
  toolButton: {
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  activeTool: {
    backgroundColor: '#0A84FF', 
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#48484A',
    marginHorizontal: 8,
  },
  actionButton: {
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 10,
    backgroundColor: '#3A1C1E', 
  },
  menuButton: {
    position: 'absolute',
    top: 60, // Exactly the same Y-level as the central toolbar
    left: 20,
    padding: 10,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    zIndex: 100, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  sidebarDrawer: {
    position: 'absolute',
    top: 0,
    bottom: 0, 
    left: 0,
    width: 260, 
    backgroundColor: '#1C1C1E', 
    borderRightWidth: 1,
    borderRightColor: '#2C2C2E',
    zIndex: 90,
    
    // Creates a shadow casting to the right over your canvas
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  sidebarContent: {
    marginTop: 130, 
    paddingHorizontal: 12,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  sidebarText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
    marginLeft: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginHorizontal: 16,
    marginVertical: 8,
  }
});