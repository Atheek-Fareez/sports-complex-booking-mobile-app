import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RoomListScreen from '../screens/RoomListScreen';
import RoomDetailsScreen from '../screens/RoomDetailsScreen';
import RoomFormScreen from '../screens/RoomFormScreen';
import CourtListScreen from '../screens/CourtListScreen';
import CourtDetailsScreen from '../screens/CourtDetailsScreen';
import PoolListScreen from '../screens/PoolListScreen';
import PoolDetailsScreen from '../screens/PoolDetailsScreen';
import CourtFormScreen from '../screens/CourtFormScreen';
import PoolFormScreen from '../screens/PoolFormScreen';
import BookingScreen from '../screens/BookingScreen';
import PaymentScreen from '../screens/PaymentScreen';
import BookingPendingScreen from '../screens/BookingPendingScreen';
import AdminBookingListScreen from '../screens/AdminBookingListScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import RaiseTicketScreen from '../screens/RaiseTicketScreen';
import MyTicketsScreen from '../screens/MyTicketsScreen';
import TicketDetailsScreen from '../screens/TicketDetailsScreen';
import AdminTicketListScreen from '../screens/AdminTicketListScreen';
import AdminTicketDetailsScreen from '../screens/AdminTicketDetailsScreen';
import MockRefundPaymentScreen from '../screens/MockRefundPaymentScreen';
import HomeScreen from '../screens/HomeScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'My Bookings' }} />
      <Stack.Screen name="RoomList" component={RoomListScreen} options={{ title: 'Rooms' }} />
      <Stack.Screen name="RoomDetails" component={RoomDetailsScreen} options={{ title: 'Room Details' }} />
      <Stack.Screen name="RoomForm" component={RoomFormScreen} options={{ title: 'Manage Room' }} />
      <Stack.Screen name="CourtList" component={CourtListScreen} options={{ title: 'Courts' }} />
      <Stack.Screen name="CourtDetails" component={CourtDetailsScreen} options={{ title: 'Court Details' }} />
      <Stack.Screen name="CourtForm" component={CourtFormScreen} options={{ title: 'Manage Court' }} />
      <Stack.Screen name="PoolList" component={PoolListScreen} options={{ title: 'Pools' }} />
      <Stack.Screen name="PoolDetails" component={PoolDetailsScreen} options={{ title: 'Pool Details' }} />
      <Stack.Screen name="PoolForm" component={PoolFormScreen} options={{ title: 'Manage Pool' }} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Confirm Booking' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment', headerBackVisible: false }} />
      <Stack.Screen name="BookingPending" component={BookingPendingScreen} options={{ title: 'Booking Submitted', headerBackVisible: false }} />
      <Stack.Screen name="AdminBookingList" component={AdminBookingListScreen} options={{ title: 'Verify Bookings' }} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Business Dashboard' }} />
      
      {/* Support Ticket Screens */}
      <Stack.Screen name="RaiseTicket" component={RaiseTicketScreen} options={{ title: 'Raise Ticket' }} />
      <Stack.Screen name="MyTickets" component={MyTicketsScreen} options={{ title: 'My Tickets' }} />
      <Stack.Screen name="TicketDetails" component={TicketDetailsScreen} options={{ title: 'Ticket Details' }} />
      <Stack.Screen name="AdminTicketList" component={AdminTicketListScreen} options={{ title: 'Support Tickets' }} />
      <Stack.Screen name="AdminTicketDetails" component={AdminTicketDetailsScreen} options={{ title: 'Ticket Management' }} />
      <Stack.Screen name="MockRefundPayment" component={MockRefundPaymentScreen} options={{ title: 'Refund Processing', headerBackVisible: false }} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
