import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useCanvasState } from '../hooks/useCanvasState';
import { Point } from '../types/canvas';

export default function App() {
  const {
    currentLine,
    completedLines,
    handleGestureStart,
    handleGestureMove,
    handleGestureEnd,
    clearCanvas
  } = useCanvasState();

  // handler for pencil/stylus drawing
  const pencilPanGesture = Gesture.Pan()
    .runOnJS(true)
    .onStart((event) => {
      handleGestureStart(event);
    })
    .onUpdate((event) => {
      handleGestureMove(event);
    })
    .onEnd((event) => {
      handleGestureEnd();
    });

  console.log(
    `Active Points: ${currentLine?.points.length || 0} | Total Lines Saved: ${completedLines.length}\n`
  );


  return (
    // ✨ UPGRADE: Root wrapper context that activates advanced hardware listeners across the glass
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Canvas style={styles.canvas}>

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
        </Canvas>

        <GestureDetector gesture={pencilPanGesture}>
          {/* This animated view sits completely invisibly over the entire screen layout */}
          <Animated.View style={StyleSheet.absoluteFill} />
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