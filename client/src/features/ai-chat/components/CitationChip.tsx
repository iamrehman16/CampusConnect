import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardActionArea, Chip, Collapse, Stack, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { Citation } from '../types/ai-chat.dto';

interface CitationsChipProps {
  citations: Citation[];
}

export function CitationsChip({ citations }: CitationsChipProps) {
  const [open, setOpen] = useState(false);

  if (citations.length === 0) return null;

  return (
    <Box sx={{ mt: 1 }}>
      <Chip
        label={`Sources (${citations.length})`}
        size="small"
        onClick={() => setOpen((prev) => !prev)}
        sx={{
          fontSize: '0.7rem',
          fontWeight: 600,
          color: 'primary.main',
          bgcolor: 'action.selected',
          border: '1px solid',
          borderColor: 'primary.light',
          borderRadius: '6px',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.focus' },
        }}
      />
      <Collapse in={open}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1 }}>
          {citations.map((citation, idx) => (
            <CitationItem key={`${citation.resourceId}-${citation.pageNumber}`} citation={citation} index={idx + 1} />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

interface CitationItemProps {
  citation: Citation;
  index: number;
}

// BACKLOG.md C3 — visually consistent with ResourceCard's design language
// (icon badge, chip metadata, hover-lift Card) rather than reusing that
// component directly: Citation only carries {title, pageNumber, semester,
// course, resourceId} from the retrieval response, none of the fields
// (fileType, uploadedBy, fileSize, approval status) ResourceCard actually
// renders. Fetching each cited resource's full record just to reuse the
// component would mean N extra requests per assistant message for a
// citation list that's already collapsed by default — out of scope for a
// client-only presentational PBI with "no backend changes."
function CitationItem({ citation, index }: CitationItemProps) {
  const navigate = useNavigate();

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: 'divider',
        borderRadius: '10px',
        bgcolor: 'background.paper',
        transition: 'border-color 0.15s',
        '&:hover': { borderColor: 'primary.light' },
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/resources/${citation.resourceId}`)}
        sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.25, py: 1 }}
      >
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: '6px',
            bgcolor: 'action.selected',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'primary.main' }}>
            {index}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            noWrap
            sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary', lineHeight: 1.4 }}
          >
            {citation.title}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ mt: 0.4 }}>
            <Chip
              label={citation.course}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 } }}
            />
            <Chip
              label={`Sem ${citation.semester}`}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 } }}
            />
            <Chip
              label={`p.${citation.pageNumber}`}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 } }}
            />
          </Stack>
        </Box>
        <OpenInNewIcon sx={{ fontSize: 14, color: 'primary.main', opacity: 0.6, flexShrink: 0 }} />
      </CardActionArea>
    </Card>
  );
}