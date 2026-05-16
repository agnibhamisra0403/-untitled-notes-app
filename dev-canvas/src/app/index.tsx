import { StyleSheet, View, GestureResponderEvent } from 'react-native';
import { Canvas, Circle } from '@shopify/react-native-skia';
import { useCanvasState } from '../hooks/useCanvasState';

export default function App() {
  const { 
    currentLine, 
    completedLines, 
    handleTouchStart, 
    handleTouchMove, 
    handleTouchEnd 
  } = useCanvasState();

  console.log(
    `Active Points: ${currentLine?.points.length || 0} | Total Lines Saved: ${completedLines.length}\n`    
  );

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        <Circle cx={200} cy={300} r={50} color="cyan" />
      </Canvas>
      <View 
        style={StyleSheet.absoluteFill}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </View>
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