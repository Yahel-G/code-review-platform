import React, { useState, useEffect } from 'react';
import { Container, Typography, List, ListItem, ListItemText, Divider, ListItemButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { getReviews } from '../services/review.service';



const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);


  useEffect(() => {
    // Use an async function inside useEffect
    const fetchReviews = async () => {
      try {
        const response = await getReviews();
        setReviews(response?.data || []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchReviews();
  }, []);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        All Reviews
      </Typography>
      <List>
        {reviews.map((review) => (
          <React.Fragment key={`${review._id}-fragment`}>
            <ListItem key={review._id} disablePadding>
              <ListItemButton component={RouterLink} to={`/reviews/${review._id}`}>
                <ListItemText
                  primary={review.title}
                  secondary={`By ${review.author.username} on ${new Date(review.createdAt).toLocaleString()}`}
                />
              </ListItemButton>
            </ListItem>
            <Divider key={`${review._id}-divider`} component="li" />
          </React.Fragment>
        ))}
      </List>
    </Container>
  );
};

export default Reviews;
