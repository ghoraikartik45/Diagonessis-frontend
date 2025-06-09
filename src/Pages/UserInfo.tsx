import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { apiService } from '../services/apiService';


interface UserInfoForm {
  name: string;
  age: string;
  profession: string;
  address: string;
}

const UserInfo: React.FC = () => {
  const [formData, setFormData] = useState<UserInfoForm>({
    name: '',
    age: '',
    profession: '',
    address: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isValidAge = (age: string): boolean => {
    const ageNum = Number(age);
    return !isNaN(ageNum) && ageNum >= 1 && ageNum <= 120;
  };

  const isSubmitDisabled = (): boolean => {
    return loading || 
           !formData.name.trim() || 
           !formData.age.trim() || 
           !isValidAge(formData.age) ||
           !formData.profession.trim() || 
           !formData.address.trim();
  };


  
    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await apiService.updateUserProfile({
        name: formData.name,
        age: parseInt(formData.age),
        profession: formData.profession,
        address: formData.address
      });

      if (response.success) {
        setSuccess('Profile updated successfully!');
        setShowSnackbar(true);
        
        // Redirect to home page after successful update
        setTimeout(() => {
          window.location.href = '/Home';
        }, 1500);
      } else {
        setError(response.message || 'Failed to update profile');
        setShowSnackbar(true);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred while updating profile');
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          User Information
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            variant="outlined"
            margin="normal"
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
            required
            error={!formData.name.trim() && formData.name.length > 0}
            helperText={!formData.name.trim() && formData.name.length > 0 ? 'Name is required' : ''}
          />

          <TextField
            fullWidth
            label="Age"
            name="age"
            type="number"
            variant="outlined"
            margin="normal"
            value={formData.age}
            onChange={handleChange}
            disabled={loading}
            required
            inputProps={{ min: 1, max: 120 }}
            error={!isValidAge(formData.age) && formData.age.length > 0}
            helperText={!isValidAge(formData.age) && formData.age.length > 0 ? 'Please enter a valid age between 1 and 120' : ''}
          />

          <TextField
            fullWidth
            label="Profession"
            name="profession"
            variant="outlined"
            margin="normal"
            value={formData.profession}
            onChange={handleChange}
            disabled={loading}
            required
            error={!formData.profession.trim() && formData.profession.length > 0}
            helperText={!formData.profession.trim() && formData.profession.length > 0 ? 'Profession is required' : ''}
          />

          <TextField
            fullWidth
            label="Address"
            name="address"
            variant="outlined"
            margin="normal"
            value={formData.address}
            onChange={handleChange}
            disabled={loading}
            required
            multiline
            rows={3}
            error={!formData.address.trim() && formData.address.length > 0}
            helperText={!formData.address.trim() && formData.address.length > 0 ? 'Address is required' : ''}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={isSubmitDisabled()}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Information'}
          </Button>
        </Box>

        <Snackbar
          open={showSnackbar}
          autoHideDuration={6000}
          onClose={() => setShowSnackbar(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setShowSnackbar(false)} 
            severity={error ? 'error' : 'success'}
            sx={{ width: '100%' }}
          >
            {error || success}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default UserInfo;