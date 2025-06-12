import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from '@mui/material';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Reviews from './pages/Reviews';
import ReviewDetail from './pages/ReviewDetail';
import Header from './components/Header';
import './App.css';

function App() {
  return (
    <>
      <Header />
      <Container component="main" sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/reviews/:id" element={<ReviewDetail />} />
        </Routes>
      </Container>
    </>
  );
}

export default App;
