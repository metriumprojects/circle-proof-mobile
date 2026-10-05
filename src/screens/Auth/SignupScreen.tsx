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
  NativeSyntheticEvent,
  TextInputChangeEventData,
  Image,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { signUp } from '../../api/service';
import { useAuth } from '../../context/AuthContext';

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
  const { login } = useAuth();

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

    try {
      // Call the signup API
      const signupData = {
        fullName: values.name,
        email: values.email,
        password: values.password,
      };
      console.log('[SignupScreen] Calling signUp API with data:', signupData);

      const response = await signUp(signupData);
      console.log('[SignupScreen] API response received:', response.data);

      // Navigate to login screen after successful signup without extracting token
      console.log('[SignupScreen] Navigating to Login screen');
      navigation.navigate('Login');

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Account created successfully! Please login.',
      });
    } catch (error: any) {
      console.error('[SignupScreen] Signup error:', error);
      let errorMessage = 'An error occurred during signup';

      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data.error || errorMessage;

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
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
  },
  formContainer: {
    marginBottom: 20,
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
  inputIcon: {
    marginRight: 10,
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
  signupButton: {
    backgroundColor: '#57B915',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  termsText: {
    color: '#777',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default SignupScreen;
