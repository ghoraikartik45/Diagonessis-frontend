import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { 
  Button, 
  TextField, 
  Typography, 
  Container, 
  Box, 
  Alert, 
  CircularProgress, 
  Snackbar 
} from '@mui/material';
import { apiService } from '../services/apiService';
import type {
  SendOtpRequest,
  VerifyOtpRequest,
  LoginRequest,
  SignupRequest,
  ForgotPasswordRequest
} from '../types/api';

type AuthMode = 'signin' | 'signup' | 'forgot';

interface FormState {
  email: string;
  otp: string;
  password: string;
  newPassword: string;
  mode: AuthMode;
  otpSent: boolean;
  otpId: string;
  verificationToken: string;
  loading: boolean;
  error: string;
  success: string;
  showSnackbar: boolean;
}

const initialFormState: FormState = {
  email: '',
  otp: '',
  password: '',
  newPassword: '',
  mode: 'signin',
  otpSent: false,
  otpId: '',
  verificationToken: '',
  loading: false,
  error: '',
  success: '',
  showSnackbar: false,
};

const SignInUp: React.FC = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<FormState>(initialFormState);

  // Helper function to update form state
  const updateFormState = (updates: Partial<FormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  };

  // Validation functions
  const validators = {
    email: (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    
    password: (password: string): boolean => {
      return password.length >= 6;
    },
    
    otp: (otp: string): boolean => {
      return otp.length === 6 && /^\d+$/.test(otp);
    }
  };

  // Error and success handling
  const handleError = (error: any) => {
    console.error('API Error:', error);
    const message = error.response?.data?.message || 
                   error.message || 
                   'An unexpected error occurred';
    updateFormState({ 
      error: message, 
      success: '', 
      showSnackbar: true, 
      loading: false 
    });
  };

  const showSuccess = (message: string) => {
    updateFormState({ 
      success: message, 
      error: '', 
      showSnackbar: true, 
      loading: false 
    });
  };

  // API handlers
  const handleSendOtp = async (): Promise<void> => {
    if (!validators.email(formState.email)) {
      updateFormState({ 
        error: 'Please enter a valid email address', 
        showSnackbar: true 
      });
      return;
    }

    updateFormState({ loading: true, error: '', success: '' });

    try {
      const otpRequest: SendOtpRequest = { email: formState.email };
      const response = await apiService.sendOtp(otpRequest);
      
      if (response.success) {
        updateFormState({ 
          otpId: response.otpId || '', 
          otpSent: true 
        });
        showSuccess('OTP sent successfully to your email');
      } else {
        updateFormState({ 
          error: response.message || 'Failed to send OTP', 
          showSnackbar: true, 
          loading: false 
        });
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleVerifyOtp = async (): Promise<boolean> => {
    if (!validators.otp(formState.otp)) {
      updateFormState({ 
        error: 'Please enter a valid 6-digit OTP', 
        showSnackbar: true 
      });
      return false;
    }

    updateFormState({ loading: true, error: '', success: '' });

    try {
      const verifyRequest: VerifyOtpRequest = {
        email: formState.email,
        otp: formState.otp,
        otpId: formState.otpId
      };
      
      const response = await apiService.verifyOtp(verifyRequest);
      
      if (response.success) {
        updateFormState({ 
          verificationToken: response?.verificationToken || '' 
        });
        showSuccess('OTP verified successfully');
        return true;
      } else {
        updateFormState({ 
          error: response.message || 'Invalid OTP', 
          showSnackbar: true, 
          loading: false 
        });
        return false;
      }
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  const handleSignIn = async (): Promise<void> => {
    if (!validators.email(formState.email)) {
      updateFormState({ 
        error: 'Please enter a valid email address', 
        showSnackbar: true 
      });
      return;
    }

    if (!validators.password(formState.password)) {
      updateFormState({ 
        error: 'Password must be at least 6 characters long', 
        showSnackbar: true 
      });
      return;
    }

    updateFormState({ loading: true, error: '', success: '' });

    try {
      const loginRequest: LoginRequest = {
        email: formState.email,
        password: formState.password
      };
      
      const response = await apiService.login(loginRequest);
      
      if (response.success) {
        showSuccess('Sign in successful');
        setTimeout(() => {
          navigate('/home');
        }, 1500);
      } else {
        updateFormState({ 
          error: response.message || 'Sign in failed', 
          showSnackbar: true, 
          loading: false 
        });
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleSignUp = async (): Promise<void> => {
    if (!validators.password(formState.newPassword)) {
      updateFormState({ 
        error: 'Password must be at least 6 characters long', 
        showSnackbar: true 
      });
      return;
    }

    if (!formState.verificationToken) {
      updateFormState({ 
        error: 'Please verify your email first', 
        showSnackbar: true 
      });
      return;
    }

    updateFormState({ loading: true, error: '', success: '' });

    try {
      const signupRequest: SignupRequest = {
        email: formState.email,
        password: formState.newPassword,
        verificationToken: formState.verificationToken
      };
      
      const response = await apiService.register(signupRequest);
      
      if (response.success) {
        showSuccess('Account created successfully');
        setTimeout(() => {
          navigate('/user-info');
        }, 1500);
      } else {
        updateFormState({ 
          error: response.message || 'Sign up failed', 
          showSnackbar: true, 
          loading: false 
        });
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleForgotPasswordSubmit = async (): Promise<void> => {
    if (!validators.password(formState.newPassword)) {
      updateFormState({ 
        error: 'Password must be at least 6 characters long', 
        showSnackbar: true 
      });
      return;
    }

    if (!formState.verificationToken) {
      updateFormState({ 
        error: 'Please verify your email first', 
        showSnackbar: true 
      });
      return;
    }

    updateFormState({ loading: true, error: '', success: '' });

    try {
      const forgotPasswordRequest: ForgotPasswordRequest = {
        email: formState.email,
        newPassword: formState.newPassword,
        verificationToken: formState.verificationToken
      };
      
      const response = await apiService.forgotPassword(forgotPasswordRequest);
      
      if (response.success) {
        showSuccess('Password reset successfully');
        setTimeout(() => {
          resetForm();
          updateFormState({ mode: 'signin' });
        }, 2000);
      } else {
        updateFormState({ 
          error: response.message || 'Password reset failed', 
          showSnackbar: true, 
          loading: false 
        });
      }
    } catch (error) {
      handleError(error);
    }
  };

  // Form handlers
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    switch (formState.mode) {
      case 'signin':
        await handleSignIn();
        break;
        
      case 'signup':
        if (!formState.otpSent) {
          await handleSendOtp();
        } else if (!formState.verificationToken) {
          const verified = await handleVerifyOtp();
          if (!verified) return;
        } else {
          await handleSignUp();
        }
        break;
        
      case 'forgot':
        if (!formState.otpSent) {
          await handleSendOtp();
        } else if (!formState.verificationToken) {
          const verified = await handleVerifyOtp();
          if (!verified) return;
        } else {
          await handleForgotPasswordSubmit();
        }
        break;
    }
  };

  // Utility functions
  const resetForm = (): void => {
    setFormState({
      ...initialFormState,
      mode: formState.mode, // Preserve the current mode
    });
  };

  const handleModeToggle = (): void => {
    const newMode = formState.mode === 'signin' ? 'signup' : 'signin';
    setFormState({ ...initialFormState, mode: newMode });
  };

  const handleForgotPassword = (): void => {
    setFormState({ ...initialFormState, mode: 'forgot' });
  };

  // UI helper functions
  const getSubmitButtonText = (): string => {
    if (formState.loading) return '';
    
    switch (formState.mode) {
      case 'signin':
        return 'Sign In';
        
      case 'signup':
        if (!formState.otpSent) return 'Send OTP';
        if (!formState.verificationToken) return 'Verify OTP';
        return 'Create Account';
        
      case 'forgot':
        if (!formState.otpSent) return 'Send Reset OTP';
        if (!formState.verificationToken) return 'Verify OTP';
        return 'Reset Password';
        
      default:
        return 'Submit';
    }
  };

  const isSubmitDisabled = (): boolean => {
    if (formState.loading) return true;
    
    switch (formState.mode) {
      case 'signin':
        return !formState.email || !formState.password;
        
      case 'signup':
        if (!formState.otpSent) return !formState.email;
        if (!formState.verificationToken) return !formState.otp;
        return !formState.newPassword;
        
      case 'forgot':
        if (!formState.otpSent) return !formState.email;
        if (!formState.verificationToken) return !formState.otp;
        return !formState.newPassword;
        
      default:
        return false;
    }
  };

  const getModeTitle = (): string => {
    switch (formState.mode) {
      case 'signin': return 'Sign In';
      case 'signup': return 'Sign Up';
      case 'forgot': return 'Reset Password';
      default: return 'Authentication';
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          {getModeTitle()}
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            variant="outlined"
            margin="normal"
            value={formState.email}
            onChange={(e) => updateFormState({ email: e.target.value })}
            disabled={formState.loading || (formState.otpSent && formState.mode !== 'signin')}
            required
            error={!validators.email(formState.email) && formState.email.length > 0}
            helperText={
              !validators.email(formState.email) && formState.email.length > 0 
                ? 'Please enter a valid email' 
                : ''
            }
          />

          {formState.mode === 'signin' && (
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={formState.password}
              onChange={(e) => updateFormState({ password: e.target.value })}
              disabled={formState.loading}
              required
              error={!validators.password(formState.password) && formState.password.length > 0}
              helperText={
                !validators.password(formState.password) && formState.password.length > 0 
                  ? 'Password must be at least 6 characters' 
                  : ''
              }
            />
          )}

          {((formState.mode === 'signup' || formState.mode === 'forgot') && 
            formState.otpSent && 
            !formState.verificationToken) && (
            <TextField
              fullWidth
              label="Enter 6-digit OTP"
              variant="outlined"
              margin="normal"
              value={formState.otp}
              onChange={(e) => updateFormState({ 
                otp: e.target.value.replace(/\D/g, '').slice(0, 6) 
              })}
              disabled={formState.loading}
              required
              inputProps={{ maxLength: 6 }}
              error={!validators.otp(formState.otp) && formState.otp.length > 0}
              helperText={
                !validators.otp(formState.otp) && formState.otp.length > 0 
                  ? 'OTP must be 6 digits' 
                  : 'Check your email for the OTP'
              }
            />
          )}

          {((formState.mode === 'signup' || formState.mode === 'forgot') && 
            formState.verificationToken) && (
            <TextField
              fullWidth
              label={formState.mode === 'signup' ? 'Create Password' : 'New Password'}
              type="password"
              variant="outlined"
              margin="normal"
              value={formState.newPassword}
              onChange={(e) => updateFormState({ newPassword: e.target.value })}
              disabled={formState.loading}
              required
              error={!validators.password(formState.newPassword) && formState.newPassword.length > 0}
              helperText="Minimum 6 characters"
            />
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={isSubmitDisabled()}
          >
            {formState.loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              getSubmitButtonText()
            )}
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button 
              color="secondary" 
              onClick={handleModeToggle} 
              size="small"
              disabled={formState.loading}
            >
              {formState.mode === 'signin' ? 'Create an account' : 'Already have an account?'}
            </Button>
            
            {formState.mode !== 'forgot' ? (
              <Button 
                color="secondary" 
                onClick={handleForgotPassword} 
                size="small"
                disabled={formState.loading}
              >
                Forgot Password?
              </Button>
            ) : (
              <Button 
                color="secondary" 
                onClick={() => setFormState({ ...initialFormState, mode: 'signin' })} 
                size="small"
                disabled={formState.loading}
              >
                Back to Sign In
              </Button>
            )}
          </Box>
        </Box>

        <Snackbar
          open={formState.showSnackbar}
          autoHideDuration={6000}
          onClose={() => updateFormState({ showSnackbar: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => updateFormState({ showSnackbar: false })} 
            severity={formState.error ? 'error' : 'success'}
            sx={{ width: '100%' }}
          >
            {formState.error || formState.success}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default SignInUp;