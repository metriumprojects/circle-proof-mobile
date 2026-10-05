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
} from 'react-native';
import { Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  // const loginSchema = Yup.object().shape({
  //   email: Yup.string().email('Invalid email').required('Required'),
  //   password: Yup.string().min(6, 'Too short').required('Required'),
  // });

  const handleLogin = (
    values: LoginFormValues,
    actions: FormikHelpers<LoginFormValues>,
  ) => {
    console.log('Login values:', values);
    navigation.navigate('Home');
    // Add your authentication logic here

    // Optional: reset submitting state
    actions.setSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login to your account</Text>
          </View>

          <Formik
            initialValues={{ email: '', password: '' }}
            // validationSchema={loginSchema}
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
                  />
                </View>
                {touched.password && errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

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
    backgroundColor: '#4a90e2',
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
