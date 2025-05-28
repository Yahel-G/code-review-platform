import React, { useState, useEffect } from 'react';
import { Container, Typography, List, ListItem, ListItemText, Divider, ListItemButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { getReviews } from '../services/review.service';
import { useAuth } from '../context/AuthContext';

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      getReviews().then(res => setReviews(res.data)).catch(console.error);
    }
  }, [loading]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        All Reviews
      </Typography>
      <List>
        {reviews.map((review) => (
          <React.Fragment key={`${review.id}-fragment`}>
            <ListItem key={review.id} disablePadding>
              <ListItemButton component={RouterLink} to={`/reviews/${review.id}`}>
                <ListItemText
                  primary={review.title}
                  secondary={`By ${review.author.username} on ${new Date(review.createdAt).toLocaleString()}`}
                />
              </ListItemButton>
            </ListItem>
            <Divider key={`${review.id}-divider`} component="li" />
          </React.Fragment>
        ))}
      </List>
    </Container>
  );
};

export default Reviews;
