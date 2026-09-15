import { useState } from 'react';
import { Box, Card, TextField, Button, Avatar, Stack } from '@mui/material';
import { useCreatePost } from '../hooks/community.hooks';
import { useAuth } from '@/shared/hooks/useAuth';

export function CreatePost() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { mutate: createPost, isPending } = useCreatePost();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    createPost(
      { title, content },
      {
        onSuccess: () => {
          setTitle('');
          setContent('');
          setExpanded(false);
        },
      }
    );
  };

  if (!user) return null; // Or show login prompt

  return (
    <Card
      sx={{
        p: 2,
        mb: 3,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: (theme) => theme.shadows[expanded ? 4 : 1],
        transition: 'all 0.3s ease',
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {user.name?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            {expanded && (
              <TextField
                fullWidth
                placeholder="Post Title"
                variant="outlined"
                size="small"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ mb: 2 }}
                disabled={isPending}
                required
              />
            )}
            <TextField
              fullWidth
              placeholder="Share with community..."
              variant="outlined"
              size="small"
              multiline={expanded}
              minRows={expanded ? 3 : 1}
              value={content}
              onClick={() => setExpanded(true)}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPending}
              required={expanded}
              sx={{ mb: expanded ? 2 : 0 }}
            />
            {expanded && (
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  variant="text"
                  color="inherit"
                  disabled={isPending}
                  onClick={() => {
                    setExpanded(false);
                    setTitle('');
                    setContent('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isPending || !title.trim() || !content.trim()}
                >
                  {isPending ? 'Posting...' : 'Post'}
                </Button>
              </Stack>
            )}
          </Box>
        </Stack>
      </form>
    </Card>
  );
}
