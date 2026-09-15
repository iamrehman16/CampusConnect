import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Chip, Collapse, Typography } from '@mui/material';
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

function CitationItem({ citation, index }: CitationItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/resources/${citation.resourceId}`);
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px',
        p: '7px 10px',
        cursor: 'pointer',
        transition: 'background-color 0.15s, border-color 0.15s',
        '&:hover': {
          bgcolor: 'action.selected',
          borderColor: 'primary.light',
        },
        '&:active': {
          bgcolor: 'action.focus',
        },
      }}
    >
      <Box
        sx={{
          minWidth: 20,
          height: 20,
          borderRadius: '4px',
          bgcolor: 'action.selected',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mt: '1px',
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'primary.main' }}>
          {index}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'text.primary', lineHeight: 1.4 }}>
          {citation.title}
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: '2px' }}>
          {citation.course} · Sem {citation.semester} · Page.{citation.pageNumber}
        </Typography>
      </Box>
      <OpenInNewIcon sx={{ fontSize: 13, color: 'primary.main', opacity: 0.6, mt: '3px', flexShrink: 0 }} />
    </Box>
  );
}