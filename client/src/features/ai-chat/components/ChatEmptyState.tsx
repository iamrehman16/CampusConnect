import { Box, Typography, Chip } from '@mui/material';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

const SUGGESTIONS = [
  'Explain normalization in databases',
  'What is the OSI model?',
  'Summarize linked lists',
];

interface ChatEmptyStateProps {
  onSuggestionClick: (text: string) => void;
}

export function ChatEmptyState({ onSuggestionClick }: ChatEmptyStateProps) {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.25,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: '14px',
          bgcolor: 'action.selected',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 0.5,
        }}
      >
        <SmartToyOutlinedIcon sx={{ color: 'primary.main', fontSize: 26 }} />
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        What would you like to learn?
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 260, lineHeight: 1.55 }}>
        Ask me anything from uploaded course resources.
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, justifyContent: 'center', mt: 0.5 }}>
        {SUGGESTIONS.map((text) => (
          <Chip
            key={text}
            label={text}
            size="small"
            onClick={() => onSuggestionClick(text)}
            sx={{
              fontSize: '0.75rem',
              color: 'text.secondary',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'transparent',
              borderRadius: '16px',
              cursor: 'pointer',
              '&:hover': {
                color: 'primary.main',
                borderColor: 'primary.light',
                bgcolor: 'action.hover',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}