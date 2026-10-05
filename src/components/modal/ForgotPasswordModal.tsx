import React, { useState, useRef } from 'react';
import {
  View,
  Text,
 TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { sendOtp, verifyOtp, resetPassword } from '../../api/service';

const { width } = Dimensions.get('window');

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ visible, onClose }) => {
  const [step, setStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSendOtp, setIsLoadingSendOtp] = useState(false);
  const [isLoadingVerifyOtp, setIsLoadingVerifyOtp] = useState(false);
  const [isLoadingResend, setIsLoadingResend] = useState(false);
  const [isLoadingResetPassword, setIsLoadingResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Start cooldown timer when resend button is pressed
  const startResendCooldown = () => {
    setIsResending(true);
    setResendCooldown(60); // 60 seconds cooldown
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsResending(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return; // Prevent multiple clicks during cooldown

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Invalid email format');
      return;
    } else {
      setEmailError('');
    }

    setIsLoadingResend(true);
    setMessage(null);
    try {
      const response = await sendOtp({ email });
      if (response.data.success) {
        // Reset OTP input fields when resending
        setOtp(['', '', '', '', '', '']);
        setMessage({type: 'success', text: 'OTP has been resent to your email. Please check your inbox.'});
        // Auto-remove message after 3 seconds
        setTimeout(() => {
          setMessage(null);
        }, 3000);
        startResendCooldown();
      } else {
        setMessage({type: 'error', text: response.data.message || 'Failed to send OTP'});
        // Auto-remove error message after 4 seconds
        setTimeout(() => {
          setMessage(null);
        }, 4000);
      }
    } catch (error: any) {
      console.error('Error resending OTP:', error);
      setMessage({type: 'error', text: error.response?.data?.message || 'An error occurred while sending OTP'});
      // Auto-remove error message after 4 seconds
      setTimeout(() => {
        setMessage(null);
      }, 4000);
    } finally {
      setIsLoadingResend(false);
    }
  };

  const otpInputRefs = useRef<(TextInput | null)[]>(Array(6).fill(null));

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Invalid email format');
      return;
    } else {
      setEmailError('');
    }

    setIsLoadingSendOtp(true);
    setMessage(null);
    try {
      const response = await sendOtp({ email });
      if (response.data.success) {
        setMessage({type: 'success', text: 'OTP sent to your email. Please check your inbox.'});
        // Auto-remove message after 3 seconds
        setTimeout(() => {
          setMessage(null);
        }, 3000);
        setStep('otp');
      } else {
        setMessage({type: 'error', text: response.data.message || 'Failed to send OTP'});
        // Auto-remove error message after 4 seconds
        setTimeout(() => {
          setMessage(null);
        }, 4000);
      }
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      setMessage({type: 'error', text: error.response?.data?.message || 'An error occurred while sending OTP'});
      // Auto-remove error message after 4 seconds
      setTimeout(() => {
        setMessage(null);
      }, 4000);
    } finally {
      setIsLoadingSendOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setMessage({type: 'error', text: 'Please enter a 6-digit OTP'});
      // Auto-remove error message after 4 seconds
      setTimeout(() => {
        setMessage(null);
      }, 4000);
      return;
    }

    setIsLoadingVerifyOtp(true);
    setMessage(null);
    try {
      const response = await verifyOtp({ email, otp: otpString });
      if (response.data.success) {
        setResetToken(response.data.data.resetToken);
        setMessage({type: 'success', text: 'OTP verified successfully. Please enter your new password.'});
        // Auto-remove message after 3 seconds
        setTimeout(() => {
          setMessage(null);
        }, 3000);
        setStep('newPassword');
      } else {
        setMessage({type: 'error', text: response.data.message || 'Failed to verify OTP'});
        // Auto-remove error message after 4 seconds
        setTimeout(() => {
          setMessage(null);
        }, 4000);
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      setMessage({type: 'error', text: error.response?.data?.message || 'An error occurred while verifying OTP'});
      // Auto-remove error message after 4 seconds
      setTimeout(() => {
        setMessage(null);
      }, 4000);
    } finally {
      setIsLoadingVerifyOtp(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (newPassword !== confirmPassword) {
      setNewPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setNewPasswordError('Password must be at least 8 characters');
      return;
    } else {
      setNewPasswordError('');
    }

    setIsLoadingResetPassword(true);
    setMessage(null);
    try {
      const response = await resetPassword({ resetToken, newPassword });
      if (response.data.success) {
        setMessage({type: 'success', text: 'Your password has been reset successfully!'});
        // Auto-remove message after 1.5 seconds and close modal
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1500);
      } else {
        setMessage({type: 'error', text: response.data.message || 'Failed to reset password'});
        // Auto-remove error message after 4 seconds
        setTimeout(() => {
          setMessage(null);
        }, 4000);
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setMessage({type: 'error', text: error.response?.data?.message || 'An error occurred while resetting password'});
      // Auto-remove error message after 4 seconds
      setTimeout(() => {
        setMessage(null);
      }, 4000);
    } finally {
      setIsLoadingResetPassword(false);
    }
  };

  const resetForm = () => {
  setEmail('');
  setEmailError('');
  setOtp(['', '', '', '', '', '']);
  setNewPassword('');
  setConfirmPassword('');
  setNewPasswordError('');
  setStep('email');
  setResetToken('');
  setIsLoading(false);
  setResendCooldown(0);
  setIsResending(false);
  setMessage(null);
};

  const handleOtpChange = (index: number, value: string) => {
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to next input if current input is filled and not the last one
      if (value && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      } else if (!value && index > 0) {
        // Move to previous input if current input is cleared
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input when backspace is pressed on an empty field
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const isAllOtpFilled = () => {
    return otp.every(digit => digit !== '');
  };

  const renderOtpInputs = () => {
    return (
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              otpInputRefs.current[index] = ref;
            }}
            style={[styles.otpInput, { width: (width - 100) / 6 }]}
            value={digit}
            onChangeText={(value) => handleOtpChange(index, value)}
            onKeyPress={(e) => handleOtpKeyPress(index, e)}
            keyboardType="numeric"
            maxLength={1}
            autoFocus={index === 0}
            textAlign="center"
          />
        ))}
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {step === 'email' && 'Forgot Password'}
            {step === 'otp' && 'Enter OTP'}
            {step === 'newPassword' && 'Reset Password'}
          </Text>

          {/* Message display */}
          {message && (
            <View style={[styles.messageContainer, message.type === 'success' ? styles.successMessage : styles.errorMessage]}>
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          )}

          {step === 'email' && (
            <>
              <Text style={styles.modalSubtitle}>
                Enter your email address and we'll send you an OTP to reset your password
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError(''); // Clear error when user starts typing
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              <TouchableOpacity style={styles.continueButton} onPress={handleSendOtp} disabled={isLoadingSendOtp}>
                {isLoadingSendOtp ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.continueButtonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === 'otp' && (
            <>
              <Text style={styles.modalSubtitle}>
                We've sent an OTP to {email}. Please enter it below.
              </Text>
              {renderOtpInputs()}
              
              {/* Continue button - disabled until all 6 digits are entered */}
              <TouchableOpacity 
                style={[styles.continueButton, (!isAllOtpFilled() || isLoadingVerifyOtp) && styles.disabledButton]} 
                onPress={handleVerifyOtp}
                disabled={!isAllOtpFilled() || isLoadingVerifyOtp}
              >
                {isLoadingVerifyOtp ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.continueButtonText}>Continue</Text>
                )}
              </TouchableOpacity>
              
              {/* Resend button with cooldown */}
              <TouchableOpacity 
                style={[styles.resendButton, isResending && styles.disabledButton]} 
                onPress={handleResendOtp}
                disabled={isResending || isLoadingResend}
              >
                {isLoadingResend ? (
                  <ActivityIndicator size="small" color="#333" />
                ) : (
                  <Text style={styles.resendButtonText}>
                    {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === 'newPassword' && (
            <>
              <Text style={styles.modalSubtitle}>
                Enter your new password
              </Text>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.inputField}
                  placeholder="New Password"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (newPasswordError) setNewPasswordError(''); // Clear error when user starts typing
                  }}
                  secureTextEntry={secureTextEntry}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                >
                  <Image
                    source={secureTextEntry ? require('../../assets/icons/eye.png') : require('../../assets/icons/hidden.png')}
                    style={styles.eyeIconImage}
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.inputField}
                  placeholder="Confirm Password"
                  placeholderTextColor="#99"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (newPasswordError) setNewPasswordError(''); // Clear error when user starts typing
                  }}
                  secureTextEntry={confirmSecureTextEntry}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}
                >
                  <Image
                    source={confirmSecureTextEntry ? require('../../assets/icons/eye.png') : require('../../assets/icons/hidden.png')}
                    style={styles.eyeIconImage}
                  />
                </TouchableOpacity>
              </View>
              
              {newPasswordError ? <Text style={styles.errorText}>{newPasswordError}</Text> : null}
              <TouchableOpacity style={styles.doneButton} onPress={handleSetNewPassword} disabled={isLoadingResetPassword}>
                {isLoadingResetPassword ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.doneButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={() => {
            onClose();
            resetForm();
          }}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(65, 63, 63, 0.5)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  messageContainer: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    width: '100%',
  },
  successMessage: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
  },
  messageText: {
    color: '#155724',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  errorText: {
    color: '#ff3333',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 10,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    fontSize: 18,
    height: 50,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  inputField: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },
 eyeIconImage: {
    width: 24,
    height: 24,
    tintColor: '#777',
  },
  continueButton: {
    backgroundColor: '#57B915',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  continueButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  doneButton: {
    backgroundColor: '#57B915',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  doneButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  resendButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  resendButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ForgotPasswordModal;
