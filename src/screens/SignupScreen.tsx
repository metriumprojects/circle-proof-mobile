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
} from 'react-native';
import { Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { useNavigation, NavigationProp } from '@react-navigation/native';

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

  const signupSchema = Yup.object().shape({
    name: Yup.string().required('Required'),
    email: Yup.string().email('Invalid email').required('Required'),
    password: Yup.string().min(6, 'Too short').required('Required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), undefined], 'Passwords must match')
      .required('Required'),
  });

  const handleSignup = (
    values: SignupFormValues,
    actions: FormikHelpers<SignupFormValues>,
  ) => {
    console.log('Signup values:', values);
    // Add your signup logic here

    // Optional: reset the form or stop submitting
    actions.setSubmitting(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
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
                  placeholderTextColor="#999"
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

              {/* Password */}
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
                ></TouchableOpacity>
              </View>
              {touched.password && errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#999"
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
                ></TouchableOpacity>
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
  errorText: {
    color: '#ff3333',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 10,
  },
  signupButton: {
    backgroundColor: '#4a90e2',
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
