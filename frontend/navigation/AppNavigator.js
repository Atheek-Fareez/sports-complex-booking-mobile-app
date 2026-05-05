import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import CourtListScreen from '../screens/CourtListScreen';
import CourtDetailsScreen from '../screens/CourtDetailsScreen';
import PoolListScreen from '../screens/PoolListScreen';
import PoolDetailsScreen from '../screens/PoolDetailsScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CourtList" component={CourtListScreen} options={{ title: 'Courts' }} />
      <Stack.Screen name="CourtDetails" component={CourtDetailsScreen} options={{ title: 'Court Details' }} />
      <Stack.Screen name="PoolList" component={PoolListScreen} options={{ title: 'Pools' }} />
      <Stack.Screen name="PoolDetails" component={PoolDetailsScreen} options={{ title: 'Pool Details' }} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
