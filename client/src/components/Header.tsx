import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}
        >
          CodeReview
        </Typography>
        {user ? (
          <>
            <Button color="inherit" component={RouterLink} to="/reviews">
              Reviews
            </Button>
            <Button color="inherit" onClick={logout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button color="inherit" component={RouterLink} to="/login">
              Login
            </Button>
            <Button color="inherit" component={RouterLink} to="/register">
              Register
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
