import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

export default function App() {
  const handleStateChange = () => {
    if (Platform.OS === 'web') {
      // Remove focus from any active element before hiding the screen with aria-hidden
      setTimeout(() => {
        if (typeof document !== 'undefined' && document.activeElement) {
          // Blur the element to drop focus out of the disappearing container
          document.activeElement.blur();
          // Return focus to a safe visible element (the document body itself)
          if (document.body) {
            document.body.focus();
          }
        }
      }, 0);
    }
  };

  return (
    <NavigationContainer onStateChange={handleStateChange}>
      <AppNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
