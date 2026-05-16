import { StyleSheet, View } from 'react-native';
import { Canvas, Circle } from '@shopify/react-native-skia';

export default function App() {
  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        <Circle cx={200} cy={300} r={50} color="cyan" />
      </Canvas>
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