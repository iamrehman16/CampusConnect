import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: { md: 3 },
        px: { xs: 0, md: 3 },
        py: { xs: 0, md: 2 },
        maxWidth: 1200,
        mx: 'auto',
        width: '100%',
        height: '100%',
      }}
    >
      {/* Center column */}
      <Box sx={{ flex: 1, minWidth: 0, height: '100%' }}>
        {children}
      </Box>
    </Box>
  );
}