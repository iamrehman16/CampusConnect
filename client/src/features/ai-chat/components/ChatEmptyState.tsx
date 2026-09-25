import { Box, ButtonBase, Typography } from '@mui/material';
import { AutoAwesome } from "@/shared/icons";

// Grounded in the library's actual content (same set as Home's Ask card),
// so a first question gets a cited answer.
const SUGGESTIONS = [
  { title: 'Explain normalization up to BCNF', hint: 'Database Systems · CS-321' },
  { title: 'How does TCP slow start work?', hint: 'Computer Networks · CS-341' },
  { title: "Walk me through the Banker's algorithm", hint: 'Operating Systems · CS-311' },
  { title: 'When does dynamic programming apply?', hint: 'Algorithms · CS-202' },
];

interface ChatEmptyStateProps {
  onSuggestionClick: (text: string) => void;
}

/** New-chat state (BACKLOG.md D8): a clear prompt and 4 starter questions. */
export function ChatEmptyState({ onSuggestionClick }: ChatEmptyStateProps) {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'primary.main' }}>
        <AutoAwesome sx={{ fontSize: 20 }} />
        <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1 }}>
          Study assistant
        </Typography>
      </Box>
      <Typography variant="h5" component="h2" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
        What are you studying today?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 3, maxWidth: 520 }}>
        Answers come from notes, slides and past papers shared on CampusConnect,
        with links to the exact source.
      </Typography>

      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        {SUGGESTIONS.map((s) => (
          <ButtonBase
            key={s.title}
            onClick={() => onSuggestionClick(s.title)}
            sx={{
              display: 'block',
              textAlign: 'left',
              p: 1.75,
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'border.default',
              transition: (t) => t.transitions.create(['border-color', 'background-color']),
              '&:hover': { borderColor: 'border.strong', bgcolor: 'surface.subtle' },
            }}
          >
            <Typography variant="body2" fontWeight={600}>{s.title}</Typography>
            <Typography variant="caption" color="text.tertiary">{s.hint}</Typography>
          </ButtonBase>
        ))}
      </Box>
    </Box>
  );
}
