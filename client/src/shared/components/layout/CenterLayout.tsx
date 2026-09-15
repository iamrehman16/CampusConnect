import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

interface CenterLayoutProps {
  children: ReactNode;
  maxWidth?: number;
}

export default function CenterLayout({
  children,
  maxWidth = 860,
}: CenterLayoutProps) {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth,
        mx: 'auto',
        px: { xs: 0, sm: 2, md: 3 },
        py: { xs: 0, md: 2 },
      }}
    >
      {children}
    </Box>
  );
}