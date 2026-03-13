import React, { useState } from 'react';
import { StyleSheet, View, Text, StatusBar, SafeAreaView } from 'react-native';
import { Tube } from './src/components/Tube';
import { canPour } from './src/logic/engine';

export default function App() {
  // A simple hardcoded starting level state
  const [tubes, setTubes] = useState<string[][]>([
    ['#FF6B6B', '#4ECDC4', '#FF6B6B', '#4ECDC4'], 
    ['#4ECDC4', '#FF6B6B', '#4ECDC4', '#FF6B6B'], 
    ['#FFE66D', '#FFE66D', '#FFE66D', '#FFE66D'],
    [],
    []
  ]);
  
  const [selectedTubeIndex, setSelectedTubeIndex] = useState<number | null>(null);

  const handleTubePress = (index: number) => {
    // If nothing selected, select this one (as long as it's not empty)
    if (selectedTubeIndex === null) {
      if (tubes[index].length > 0) {
        setSelectedTubeIndex(index);
      }
      return;
    }

    // If same tube selected twice, unselect
    if (selectedTubeIndex === index) {
      setSelectedTubeIndex(null);
      return;
    }

    // Try to pour from selected into this one
    const sourceTube = tubes[selectedTubeIndex];
    const targetTube = tubes[index];

    if (canPour(sourceTube, targetTube)) {
      // Execute the pour
      const newTubes = [...tubes];
      newTubes[selectedTubeIndex] = [...sourceTube];
      newTubes[index] = [...targetTube];

      const transferredColor = newTubes[selectedTubeIndex].pop() as string;
      newTubes[index].push(transferredColor);

      setTubes(newTubes);
      setSelectedTubeIndex(null); // Unselect after successful pour
    } else {
      // Pour failed, just change selection to the new tube instead
      if (targetTube.length > 0) {
        setSelectedTubeIndex(index);
      } else {
        setSelectedTubeIndex(null);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Frosted Sort</Text>
        <Text style={styles.subtitle}>Sort the colors. Reveal the hidden layers.</Text>
      </View>

      <View style={styles.gameBoard}>
        {tubes.map((tubeColors, index) => (
          <Tube 
            key={index}
            colors={tubeColors}
            isSelected={selectedTubeIndex === index}
            onPress={() => handleTubePress(index)}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2A2D34', // Dark pastel / OLED-ish back
  },
  header: {
    paddingTop: 60,
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A4B8',
    marginTop: 8,
  },
  gameBoard: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  }
});
