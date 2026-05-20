import { Canvas, Path, Skia, Group } from '@shopify/react-native-skia';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRef } from 'react';
import { Gesture, GestureDetector, GestureHandlerRootView, GestureUpdateEvent, PanGestureHandlerEventPayload, PanGestureChangeEventPayload } from 'react-native-gesture-handler';
import { useCanvasState } from '../hooks/useCanvasState';
import { Point } from '../types/canvas';

let eraserMode = false;

export default function App() {
  const {
    currentLine,
    completedLines,
    canvasOffsetX,
    canvasOffsetY,
    zoomMultiplier,
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
  } = useCanvasState();

  // handler for panning/drawing gestures
  const pencilPanGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onStart((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      console.log("pointer type", event.pointerType);
      console.log("number of pointers", event.numberOfPointers);
      if (event.pointerType === 0){
        // finger pan case, we need to update canvas offset here - in this case there is no end position, so we do the update here instead of onEnd
      }
      else if (event.pointerType === 1) {
        if (eraserMode) {
          handleEraserStart(event);
        }
        if (!eraserMode) {
          handleGestureStart(event);
        };
      }
    })
    .onChange((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      console.log("pointer type", event.pointerType);
      console.log("number of pointers", event.numberOfPointers);
      if (event.pointerType === 0){
        // finger pan case
        console.log("Pan Deltas:", event.changeX, event.changeY);
        updatePan(event.changeX, event.changeY);
      }
      else if (event.pointerType === 1) {
        if (eraserMode) {
          handleEraserMove(event);
        };
        if (!eraserMode) {
          handleGestureMove(event);
        };
        
      }
    })
    .onEnd((event) => {
      handleGestureEnd();
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
  
  const simultanousGestures = Gesture.Simultaneous(pencilPanGesture, canvasPinchGesture);

  console.log(
    `Active Points: ${currentLine?.points.length || 0} | Total Lines Saved: ${completedLines.length}\n`
  );


  return (
    // ✨ UPGRADE: Root wrapper context that activates advanced hardware listeners across the glass
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Canvas style={styles.canvas}>
            <Group transform={[{ translateX: canvasOffsetX }, { translateY: canvasOffsetY }, {scale: zoomMultiplier}]}>

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
          </Group>
        </Canvas>

        <GestureDetector gesture={simultanousGestures}>
          {/* This animated view sits completely invisibly over the entire screen layout */}
          <Animated.View style={StyleSheet.absoluteFill}/>
        </GestureDetector>

        {/* Clear button */}
        <Pressable
          style={{
            backgroundColor: '#f35a5aa4',
            position: 'absolute',
            bottom: 20,
            right: 20,
            borderRadius: 12,
          }}
          onPress={clearCanvas}
        >
          <Text
            style={{
              color: '#ffe4e4ff',
              fontSize: 20,
              fontWeight: 'bold',
              textAlign: 'center',
              padding: 10,
            }}
          >
            Clear
          </Text>
        </Pressable>

        {/* Eraser button */}
        <Pressable
          style={{
            backgroundColor: '#f35a5aa4',
            position: 'absolute',
            top: 50,
            left: 20,
            borderRadius: 12,
          }}
          onPress={() => {
            // the eraser mode
            eraserMode = !eraserMode;
            if (eraserMode) {
              console.log("Eraser mode enabled");
            } else {
              console.log("Eraser mode disabled");
            }
          }}
        >
          <Text
            style={{
              color: '#ffe4e4ff',
              fontSize: 20,
              fontWeight: 'bold',
              textAlign: 'center',
              padding: 10,
            }}
          >
            Eraser
          </Text>
        </Pressable>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E'
  },
  canvas: {
    flex: 1
  }
});