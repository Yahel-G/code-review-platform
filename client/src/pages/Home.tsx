import React from 'react';
import { Container, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Home = () => (
  <Container maxWidth="md" sx={{ mt: 4 }}>
    <Typography variant="h1" gutterBottom>
      Code Review Platform
    </Typography>
    <Typography variant="body1" gutterBottom>
      Collaborate on code, get feedback, and optimize with AI assistance.
    </Typography>
    <Button
      component={RouterLink}
      to="/reviews"
      variant="contained"
      color="primary"
      sx={{ mt: 2 }}
    >
      Browse Reviews
    </Button>
  </Container>
);

export default Home;
