import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, ScrollView, KeyboardAvoidingView } from 'react-native';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { auth } from '../firebase';
import { sendPasswordResetEmail, confirmPasswordReset } from 'firebase/auth';
import ChevronLeftIcon from '../assets/icons/chevron-left.svg';
import MailIcon from '../assets/icons/mail.svg';
import LockIcon from '../assets/icons/lock.svg';
import { Eye as EyeIcon } from 'lucide-react-native';
import { FormInput } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

const emailSchema = yup.object().shape({
  email: yup.string().required('Email is required').email('Enter a valid email'),
});

const passwordSchema = yup.object().shape({
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  confirmPassword: yup
    .string()
    .required('Confirm password is required')
    .oneOf([yup.ref('password'), ''], 'Passwords must match'),
});

const ForgotPasswordScreen = () => {
  const [step, setStep] = useState(1); // 1: email, 2: check email, 3: set new password
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const router = useRouter();

  // Listen for deep links
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { queryParams } = Linking.parse(event.url);
      if (queryParams?.oobCode) {
        setOobCode(queryParams.oobCode as string);
        setStep(3);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    // Check if app was opened from a link
    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        const { queryParams } = Linking.parse(initialUrl);
        if (queryParams?.oobCode) {
          setOobCode(queryParams.oobCode as string);
          setStep(3);
        }
      }
    })();
    return () => {
      subscription.remove();
    };
  }, []);

  // Step 1: Email entry
  const emailForm = useForm({
    resolver: yupResolver(emailSchema),
    defaultValues: { email: '' },
    mode: 'all',
  });

  // Step 3: Set new password
  const passwordForm = useForm({
    resolver: yupResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'all',
  });

  const handleSendResetEmail = async (data: { email: string }) => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
      setEmail(data.email);
      setStep(2);
      Toast.show({ text1: 'Password reset email sent!' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      Toast.show({ type: 'error', text1: message });
    }
    setIsLoading(false);
  };

  // Step 2: Just a UI step, user checks their email
  const handleResend = async () => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Toast.show({ text1: 'Password reset email resent!' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend email';
      Toast.show({ type: 'error', text1: message });
    }
    setIsLoading(false);
  };

  // Step 3: Set new password (user comes from email link, oobCode should be handled via deep link)
  const handleSetNewPassword = async (data: { password: string; confirmPassword: string }) => {
    setIsLoading(true);
    try {
      if (!oobCode) {
        Toast.show({ type: 'error', text1: 'Invalid or missing code from email link.' });
        setIsLoading(false);
        return;
      }
      await confirmPasswordReset(auth, oobCode, data.password);
      Toast.show({ text1: 'Password reset successful!' });
      setStep(1);
      setOobCode(null);
      router.replace('/login');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      Toast.show({ type: 'error', text1: message });
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Pressable onPress={() => (step === 1 ? router.back() : setStep(step - 1))}>
                <ChevronLeftIcon width={24} height={24} />
              </Pressable>
            </View>
            {step === 1 && (
              <View style={styles.contentBox}>
                <Text style={styles.title}>Forgot Password</Text>
                <Text style={styles.subtitle}>Please enter your email to reset the password</Text>
                <View style={styles.inputWrapper}>
                  <MailIcon width={18} height={18} style={styles.icon} />
                  <FormInput
                    placeholder="Enter your email"
                    control={emailForm.control}
                    name="email"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {emailForm.formState.errors.email && (
                  <Text style={styles.errorText}>{emailForm.formState.errors.email.message}</Text>
                )}
                <Button onPress={emailForm.handleSubmit(handleSendResetEmail)} style={styles.button} disabled={isLoading}>
                  <Text style={styles.buttonText}>{isLoading ? 'Please Wait...' : 'Reset Password'}</Text>
                </Button>
                <Text style={styles.bottomText}>
                  Back to login{' '}
                  <Text style={styles.linkText} onPress={() => router.replace('/login')}>Sign in</Text>
                </Text>
              </View>
            )}
            {step === 2 && (
              <View style={styles.contentBox}>
                <Text style={styles.title}>Check your email</Text>
                <Text style={styles.subtitle}>
                  We sent a reset link to {email.replace(/(.{2}).+(@.*)/, '$1***$2')}
                  {'\n'}Click the link in your email to reset your password.
                </Text>
                <Button onPress={handleResend} style={styles.button} disabled={isLoading}>
                  <Text style={styles.buttonText}>{isLoading ? 'Please Wait...' : 'Resend email'}</Text>
                </Button>
                <Text style={styles.bottomText}>
                  Haven't got the email yet?{' '}
                  <Text style={styles.linkText} onPress={handleResend}>Resend email</Text>
                </Text>
              </View>
            )}
            {step === 3 && (
              <View style={styles.contentBox}>
                <Text style={styles.title}>Set a new password</Text>
                <Text style={styles.subtitle}>Create a new password. Ensure it differs from previous ones for security</Text>
                <View style={styles.inputWrapper}>
                  <LockIcon width={18} height={18} style={styles.icon} />
                  <FormInput
                    placeholder="Enter your password"
                    control={passwordForm.control}
                    name="password"
                    style={styles.input}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeIcon}>
                    <EyeIcon size={18} color="#C5C5C5" />
                  </Pressable>
                </View>
                {passwordForm.formState.errors.password && (
                  <Text style={styles.errorText}>{passwordForm.formState.errors.password.message}</Text>
                )}
                <View style={styles.inputWrapper}>
                  <LockIcon width={18} height={18} style={styles.icon} />
                  <FormInput
                    placeholder="Enter your confirm password"
                    control={passwordForm.control}
                    name="confirmPassword"
                    style={styles.input}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <Pressable onPress={() => setShowConfirmPassword((v) => !v)} style={styles.eyeIcon}>
                    <EyeIcon size={18} color="#C5C5C5" />
                  </Pressable>
                </View>
                {passwordForm.formState.errors.confirmPassword && (
                  <Text style={styles.errorText}>{passwordForm.formState.errors.confirmPassword.message}</Text>
                )}
                <Button onPress={passwordForm.handleSubmit(handleSetNewPassword)} style={styles.button} disabled={isLoading}>
                  <Text style={styles.buttonText}>{isLoading ? 'Please Wait...' : 'Reset Password'}</Text>
                </Button>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
    width: '100%',
  },
  contentBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 36,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 0,
    minHeight: 380,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  input: {
    flex: 1,
    paddingLeft: 40,
    backgroundColor: '#F2F2F2',
    borderWidth: 0,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#AE9FFF',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 8,
  },
  bottomText: {
    marginTop: 18,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  linkText: {
    color: '#7F67FF',
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;
