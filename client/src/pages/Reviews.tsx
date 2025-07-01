import React, { useState, useEffect } from 'react';
import { Container, Typography, List, ListItem, ListItemText, Divider, ListItemButton, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Link as RouterLink } from 'react-router-dom';
import { getReviews, deleteReview } from '../services/review.service';



import { useAuth } from '../context/AuthContext';

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const { user, token } = useAuth();

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await deleteReview(id, token);
      setReviews(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Delete failed', err);
    }
  };


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
            {
              /* Determine if current user can delete */
            }
            <ListItem
              key={review._id}
              disablePadding
              secondaryAction={user && (user._id === review.author._id || user.role === 'admin') ? (
                <IconButton edge="end" aria-label="delete" onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(review._id);
                }}>
                  <DeleteIcon />
                </IconButton>
              ) : undefined}
            >
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
