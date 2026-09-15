import { Box, Typography, keyframes } from '@mui/material';

const bounce = keyframes`
  0%, 60%, 100% { transform: translateY(0);   opacity: 0.35; }
  30%            { transform: translateY(-5px); opacity: 1;    }
`;

export function ThinkingBubble() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
        Thinking
      </Typography>
      <Box sx={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
        {[0, 0.2, 0.4].map((delay) => (
          <Box
            key={delay}
            sx={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              animation: `${bounce} 1.2s ease-in-out ${delay}s infinite`,
            }}
          />
        ))}
      </Box>
    </Box>
  );
}