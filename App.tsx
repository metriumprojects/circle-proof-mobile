//@ts-nocheck
// App.js
import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from './src/screens/Auth/LoginScreen';
import SignupScreen from './src/screens/Auth/SignupScreen';
import ProfileScreen from './src/screens/Profile/ProfileScreen';
import ProfileView from './src/screens/Profile/ProfileView';
import ChatScreen from './src/screens/Chats/ChatScreen';
import PostScreen from './src/screens/PostScreen';
import ScoreScreen from './src/screens/ScoreScreen';
import HomeScreen from './src/screens/HomeScreen';
import { TabIcons } from './src/icons';
import ChatInterface from './src/screens/Chats/ChatInterface';
import Verification from './src/screens/Profile/Verification';
import VerificationStep2 from './src/screens/Profile/VerificationStep2';
import VerificationRequest from './src/screens/Profile/VerificationRequest';
import AddPositionScreen from './src/screens/Profile/AddPositionScreen';
import AddCompanyScreen from './src/screens/Profile/AddCompanyScreen';
import CompanyProfileScreen from './src/screens/Profile/CompanyProfileScreen';
import CompaniesScreen from './src/screens/Profile/CompaniesScreen';
import PDFViewer from './src/screens/PDFViewer/PDFViewer';
import { StatusBar } from 'react-native';
import VerifcationConfirmation from './src/screens/Profile/VerifcationConfirmation';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import Toast from 'react-native-toast-message';
import { View, Text, StyleSheet } from 'react-native';
import NotificationScreen from './src/screens/Notifications/NotificationScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: 'black',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home1"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcons.Home focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatScreen}
        options={{
          tabBarLabel: 'Chats',
          tabBarIcon: ({ focused }) => <TabIcons.Chats focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Post"
        component={PostScreen}
        options={{
          tabBarLabel: 'Post',
          tabBarIcon: ({ focused }) => <TabIcons.Post focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcons.Profile focused={focused} />,
        }}
      />
      {/* <Tab.Screen
        name="Score"
        component={ScoreScreen}
        options={{
          tabBarLabel: 'Score',
          tabBarIcon: ({ focused }) => <TabIcons.Score focused={focused} />,
        }}
      /> */}
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return null;
  }

  const initialRouteName = isAuthenticated ? 'Home' : 'Login';

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' }
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ChatInterface" component={ChatInterface} />
      <Stack.Screen name="Verification" component={Verification} />
      <Stack.Screen name="Home" component={MainTabNavigator} />
      <Stack.Screen name="VerificationStep2" component={VerificationStep2} />
      <Stack.Screen name="VerificationRequest" component={VerificationRequest} />
      <Stack.Screen name="VerifcationConfirmation" component={VerifcationConfirmation} />
      <Stack.Screen name="AddPosition" component={AddPositionScreen} />
      <Stack.Screen name="AddCompany" component={AddCompanyScreen} />
      <Stack.Screen name="CompanyProfile" component={CompanyProfileScreen} />
      <Stack.Screen name="CompaniesScreen" component={CompaniesScreen} />
      <Stack.Screen name="ProfileView" component={ProfileView} />
      <Stack.Screen name="PDFViewer" component={PDFViewer} />
      <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
    </Stack.Navigator>
  );
}

// Custom toast configuration to handle long error messages
const toastConfig = {
  // Success toast
  success: ({ text1, text2, ...rest }) => (
    <View style={[styles.baseToast, styles.successToast]}>
      <Text style={styles.title}>{text1}</Text>
      {text2 && <Text style={styles.message} numberOfLines={0}>{text2}</Text>}
    </View>
  ),
  
  // Error toast
  error: ({ text1, text2, ...rest }) => (
    <View style={[styles.baseToast, styles.errorToast]}>
      <Text style={styles.title}>{text1}</Text>
      {text2 && <Text style={styles.message} numberOfLines={0}>{text2}</Text>}
    </View>
  ),
  
  // Info toast
  info: ({ text1, text2, ...rest }) => (
    <View style={[styles.baseToast, styles.infoToast]}>
      <Text style={styles.title}>{text1}</Text>
      {text2 && <Text style={styles.message} numberOfLines={0}>{text2}</Text>}
    </View>
  ),
};

const styles = StyleSheet.create({
  baseToast: {
    minWidth: '85%',
    maxWidth: '95%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successToast: {
    backgroundColor: '#D4EDDA',
 },
  errorToast: {
    backgroundColor: '#F8D7DA',
  },
  infoToast: {
    backgroundColor: '#D1ECF1',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={true}
        />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        <Toast config={toastConfig} />
      </NotificationProvider>
    </AuthProvider>
  );
}
