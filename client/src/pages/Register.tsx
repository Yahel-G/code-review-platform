import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Register
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Username"
          fullWidth
          required
          margin="normal"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          margin="normal"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          required
          margin="normal"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
          Register
        </Button>
      </Box>
    </Container>
  );
};

export default Register;
