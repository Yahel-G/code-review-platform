import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import Editor from '@monaco-editor/react';
import { getReview } from '../services/review.service';
import { getComments, createComment } from '../services/comment.service';
import { useSocket } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';

const ReviewDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const socket = useSocket();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (socket && id) {
      socket.emit('joinReview', id);
      return () => {
        socket.emit('leaveReview', id);
      };
    }
  }, [socket, id]);

  useEffect(() => {
    if (id) {
      getReview(id).then(res => setReview(res.data));
      getComments(id).then(res => setComments(res.data));
    }
  }, [id]);

  useEffect(() => {
    if (socket) {
      socket.on('commentAdded', (comment) => {
        setComments(prev => [...prev, comment]);
      });
    }
    return () => {
      if (socket) socket.off('commentAdded');
    };
  }, [socket]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !review) return;
    try {
      await createComment(review._id, newComment);
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  if (!review) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        {review.title}
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        By {review.author.username} on {new Date(review.createdAt).toLocaleString()}
      </Typography>
      <Box sx={{ height: 400, mb: 2 }}>
        <Editor
          height="100%"
          defaultLanguage={review.language || 'javascript'}
          value={review.code}
          options={{ readOnly: true, minimap: { enabled: false } }}
        />
      </Box>
      <Typography variant="h5" gutterBottom>
        Comments
      </Typography>
      <List>
        {comments.map((c) => (
          <React.Fragment key={c._id}>
            <ListItem alignItems="flex-start">
              <ListItemText
                primary={c.author.username}
                secondary={c.content}
              />
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>
      {user && (
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Add a comment"
            multiline
            rows={3}
            fullWidth
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
          />
          <Button
            variant="contained"
            sx={{ mt: 1 }}
            onClick={handleCommentSubmit}
          >
            Submit
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default ReviewDetail;
