// screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { useNavigation, NavigationProp, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signIn } from '../../api/service';
import { useAuth } from '../../context/AuthContext';
import { getStoredToken } from '../../util/authController';
import ForgotPasswordModal from '../../components/modal/ForgotPasswordModal';

interface LoginFormValues {
  email: string;
  password: string;
}

// Define the route params type
type LoginScreenRouteProp = {
  email?: string;
  password?: string;
};

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const { login } = useAuth();
  // Get route params to handle prefilled data from signup
  const route = useRoute();
  const routeParams = route.params as LoginScreenRouteProp;

  const loginSchema = Yup.object().shape({
    email: Yup.string()
      .email('Invalid email format')
      .required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
  });

  const handleLogin = async (
    values: LoginFormValues,
    actions: FormikHelpers<LoginFormValues>,
  ) => {
    console.log('[LoginScreen] Starting login process with values:', values);

    try {
      // Call the login API
      console.log('[LoginScreen] Calling signIn API...');
      const response = await signIn(values);
      console.log('[LoginScreen] API response received:', response.data);
      console.log(response?.data, "kkk");

      const { token, user } = response.data.data;

      // Update auth context with token and user data
      console.log('[LoginScreen] Updating auth context with token and user data');
      console.log('[LoginScreen] Token before storing:', token);
      await login(token, user);
      console.log('[LoginScreen] Auth context updated successfully');
      console.log(token, user, 'ujhj');

      // Verify token is stored
      const storedToken = await getStoredToken();
      console.log('[LoginScreen] Token after storing in AsyncStorage:', storedToken);

      // Navigate to home screen
      console.log('[LoginScreen] Navigating to Home screen');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error: any) {
      console.error('[LoginScreen] Login error:', error.response);
      let errorMessage = 'An error occurred during login';

      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data.message || errorMessage;

      }
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMessage,
      });
    } finally {
      actions.setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/icons/logo.png')} style={styles.logo} />
            {/* <Text style={styles.appName}>CircleProof</Text> */}
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login to your account</Text>
          </View>

          <Formik
            initialValues={{
              email: routeParams?.email || '',
              password: routeParams?.password || ''
            }}
            validationSchema={loginSchema}
            onSubmit={handleLogin}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              isSubmitting,
            }) => (
              <View style={styles.formContainer}>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    value={values.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {touched.email && errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    value={values.password}
                    secureTextEntry={secureTextEntry}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                    accessibilityLabel={
                      secureTextEntry ? 'Show password' : 'Hide password'
                    }
                    accessible={true}
                  >
                    <Image
                      source={secureTextEntry ? require('../../assets/icons/eye.png') : require('../../assets/icons/hidden.png')}
                      style={styles.eyeIconImage}
                    />
                  </TouchableOpacity>
                </View>
                {touched.password && errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotPassword} onPress={() => setForgotPasswordVisible(true)}>
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                <ForgotPasswordModal
                  visible={forgotPasswordVisible}
                  onClose={() => setForgotPasswordVisible(false)}
                />

                {/* Login Button */}
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleSubmit as any}
                  disabled={isSubmitting}
                  accessibilityRole="button"
                >
                  <Text style={styles.loginButtonText}>
                    {isSubmitting ? 'Logging in...' : 'Login'}
                  </Text>
                </TouchableOpacity>

                {/* Sign Up Link */}
                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Don't have an account?</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Signup')}
                    accessibilityRole="button"
                  >
                    <Text style={styles.signupLink}> Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 50,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#333',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  eyeIconImage: {
    width: 24,
    height: 24,
    tintColor: '#777',
  },
  errorText: {
    color: '#ff3333',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 10,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#666',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#57B915',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupLink: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
