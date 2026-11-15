// screens/SignupScreen.tsx
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
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSignUp } from '@clerk/clerk-expo';
import { signUp } from '../../api/service';

interface SignupFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SignupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  const { isLoaded: isClerkLoaded, signUp: clerkSignUp, setActive } = useSignUp();

  const signupSchema = Yup.object().shape({
    name: Yup.string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters')
      .required('Name is required'),
    email: Yup.string()
      .email('Invalid email format')
      .required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase, one lowercase, one number and one special character'
      )
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), undefined], 'Passwords must match')
      .required('Confirm password is required'),
  });

  const handleSignup = async (
    values: SignupFormValues,
    actions: FormikHelpers<SignupFormValues>,
  ) => {
    console.log('[SignupScreen] Starting signup process with values:', values);

    // 1. First attempt Clerk registration (matches web auth)
    if (isClerkLoaded && clerkSignUp) {
      try {
        console.log('[SignupScreen] Creating Clerk account...');
        const nameParts = values.name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        const signUpAttempt = await clerkSignUp.create({
          emailAddress: values.email.trim(),
          password: values.password,
          firstName,
          lastName,
        });

        if (signUpAttempt.status === 'complete') {
          console.log('[SignupScreen] Clerk signup complete, activating session...');
          await setActive({ session: signUpAttempt.createdSessionId });
          Toast.show({
            type: 'success',
            text1: 'Welcome!',
            text2: 'Account created successfully!',
          });
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
          return;
        }
      } catch (clerkErr: any) {
        console.warn(
          '[SignupScreen] Clerk signup attempt error, falling back to direct API:',
          clerkErr?.errors?.[0]?.message || clerkErr?.message,
        );
      }
    }

    // 2. Fallback to direct backend API
    try {
      const signupData = {
        fullName: values.name,
        email: values.email,
        password: values.password,
      };
      console.log('[SignupScreen] Calling signUp API with data:', signupData);

      const response = await signUp(signupData);
      console.log('[SignupScreen] API response received:', response.data);

      navigation.navigate('Login');

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Account created successfully! Please login.',
      });
    } catch (error: any) {
      console.error('[SignupScreen] Signup error:', error);
      let errorMessage = 'An error occurred during signup';

      if (error.response?.data?.error || error.response?.data?.message) {
        errorMessage = error.response.data.error || error.response.data.message;
      }

      Toast.show({
        type: 'error',
        text1: 'Signup Failed',
        text2: errorMessage,
      });
    } finally {
      actions.setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/icons/logo.png')} style={styles.logo} />
          {/* <Text style={styles.appName}>CircleProof</Text> */}
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us today</Text>
        </View>

        <Formik
          initialValues={{
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
          }}
          validationSchema={signupSchema}
          onSubmit={handleSignup}
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
              {/* Full Name */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#99"
                  onChangeText={handleChange('name')}
                  onBlur={handleBlur('name')}
                  value={values.name}
                  autoCapitalize="words"
                  keyboardType="default"
                />
              </View>
              {touched.name && errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}

              {/* Email */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#99"
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

              {/* Password */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#99"
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

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#99"
                  onChangeText={handleChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  value={values.confirmPassword}
                  secureTextEntry={secureConfirmTextEntry}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() =>
                    setSecureConfirmTextEntry(!secureConfirmTextEntry)
                  }
                  accessibilityLabel={
                    secureConfirmTextEntry
                      ? 'Show confirm password'
                      : 'Hide confirm password'
                  }
                  accessible={true}
                >
                  <Image
                    source={secureConfirmTextEntry ? require('../../assets/icons/eye.png') : require('../../assets/icons/hidden.png')}
                    style={styles.eyeIconImage}
                  />
                </TouchableOpacity>
              </View>
              {touched.confirmPassword && errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}

              {/* Signup Button */}
              <TouchableOpacity
                style={styles.signupButton}
                onPress={handleSubmit as any}
                disabled={isSubmitting}
                accessibilityRole="button"
              >
                <Text style={styles.signupButtonText}>
                  {isSubmitting ? 'Signing Up...' : 'Sign Up'}
                </Text>
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account?</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  accessibilityRole="button"
                >
                  <Text style={styles.loginLink}> Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>

        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
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
    marginBottom: 20,
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
  inputIcon: {
    marginRight: 10,
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
  signupButton: {
    backgroundColor: '#57B915',
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: '#667085',
    fontSize: 14,
  },
  loginLink: {
    color: '#57B915',
    fontSize: 14,
    fontWeight: '600',
  },
  termsContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  termsText: {
    color: '#667085',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default SignupScreen;
