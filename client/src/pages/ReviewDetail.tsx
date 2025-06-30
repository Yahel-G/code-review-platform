import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
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
  Table,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
} from '@mui/material';
import Editor from '@monaco-editor/react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SecurityIcon from '@mui/icons-material/Security';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
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

      <Divider sx={{ my: 3 }} />

      {/* Performance Metrics Section */}
      {review.metrics && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            <InfoOutlinedIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
            Performance Metrics
          </Typography>
          <Table size="small" sx={{ maxWidth: 500 }}>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Tooltip title="Total elapsed time for analysis (ms)">
                    <span><b>Analysis Time</b></span>
                  </Tooltip>
                </TableCell>
                <TableCell>{review.metrics.analysisTimeMs ?? 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Tooltip title="CPU time spent in user mode (microseconds)">
                    <span><b>User CPU Time</b></span>
                  </Tooltip>
                </TableCell>
                <TableCell>{review.metrics.cpuUserMicros ?? 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Tooltip title="CPU time spent in system/kernel mode (microseconds)">
                    <span><b>System CPU Time</b></span>
                  </Tooltip>
                </TableCell>
                <TableCell>{review.metrics.cpuSystemMicros ?? 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Tooltip title="Peak memory usage during analysis (KB)">
                    <span><b>Peak Memory</b></span>
                  </Tooltip>
                </TableCell>
                <TableCell>{review.metrics.memoryKb ?? 'N/A'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Security Issues Section */}
      {review.issues && review.issues.filter((i: { ruleId: string; }) => i.ruleId && i.ruleId.startsWith('security-')).length > 0 && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom color="error">
            <WarningAmberIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'error.main' }} />
            Security Issues Detected
          </Typography>
          <List>
            {review.issues
              .filter((i: { ruleId: string; }) => i.ruleId && i.ruleId.startsWith('security-'))
              .map((issue: { ruleId: string; line: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; message: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }, idx: React.Key | null | undefined) => (
                <ListItem key={idx} sx={{ mb: 1, borderRadius: 1, alignItems: 'flex-start' }}>
                  <ListItemText
                    primary={
                      <span style={{ fontWeight: 'bold', color: '#b71c1c' }}>
                        {issue.ruleId.replace('security-', '')} (Line {issue.line})
                      </span>
                    }
                    secondary={issue.message}
                  />
                </ListItem>
              ))}
          </List>
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

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
            fullWidth
            multiline
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            variant="outlined"
            margin="normal"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleCommentSubmit}
            sx={{ mt: 1 }}
          >
            Post Comment
          </Button>
        </Box>
      )}
      {/* AI Suggestions Section */}
      {review.aiSuggestions && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            <AutoFixHighIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
            AI-Powered Suggestions
          </Typography>
          <Box sx={{ 
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 1,
            border: '1px solid #e0e0e0'
          }}>
            {review.aiSuggestions}
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default ReviewDetail;