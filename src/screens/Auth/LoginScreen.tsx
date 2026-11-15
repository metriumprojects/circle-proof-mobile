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
import { useSignIn } from '@clerk/clerk-expo';
import { signIn } from '../../api/service';
import { useAuth } from '../../context/AuthContext';
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
  const { signIn: clerkSignIn, setActive, isLoaded: isClerkLoaded } = useSignIn();

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

    // 1. First attempt Clerk authentication (matches web login)
    if (isClerkLoaded && clerkSignIn) {
      try {
        console.log('[LoginScreen] Attempting Clerk sign in...');
        const signInAttempt = await clerkSignIn.create({
          identifier: values.email.trim(),
          password: values.password,
        });

        if (signInAttempt.status === 'complete') {
          console.log('[LoginScreen] Clerk sign in complete, activating session...');
          await setActive({ session: signInAttempt.createdSessionId });
          Toast.show({
            type: 'success',
            text1: 'Login Successful',
            text2: 'Welcome to CircleProof!',
          });
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
          return;
        }
      } catch (clerkErr: any) {
        console.warn(
          '[LoginScreen] Clerk login attempt failed, falling back to direct API:',
          clerkErr?.errors?.[0]?.message || clerkErr?.message,
        );
      }
    }

    // 2. Fallback to direct backend API (for legacy accounts)
    try {
      console.log('[LoginScreen] Calling fallback signIn API...');
      const response = await signIn(values);
      console.log('[LoginScreen] API response received:', response.data);

      const { token, user } = response.data.data;
      await login(token, user);

      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error: any) {
      console.error('[LoginScreen] Login error:', error.response);
      let errorMessage = 'Invalid email or password';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
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
    fontWeight: '700',
    color: '#191C1F',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#667085',
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eaecf0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    marginBottom: 16,
    height: 50,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#191C1F',
    fontSize: 15,
  },
  eyeIcon: {
    padding: 10,
  },
  eyeIconImage: {
    width: 22,
    height: 22,
    tintColor: '#667085',
  },
  errorText: {
    color: '#ff0031',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 6,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#667085',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#57B915',
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    color: '#667085',
    fontSize: 14,
  },
  signupLink: {
    color: '#57B915',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
