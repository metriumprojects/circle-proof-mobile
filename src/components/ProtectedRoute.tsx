import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { View, Text, ActivityIndicator } from 'react-native';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

interface RootStackParamList {
  Login: undefined;
  // Add other route names as needed
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, checkAuthStatus } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [isAuthenticated, loading, navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#57B915" />
        <Text style={{ marginTop: 10 }}>Checking authentication...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null; // The navigation effect will handle redirecting to login
  }

  return <>{children}</>;
};

export default ProtectedRoute;
