import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import SchoolIcon from '@mui/icons-material/School';
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver';
import { footerLinks } from '../../data/landingContent';

export default function Footer() {
  const { isIntersecting, targetRef } = useIntersectionObserver({ threshold: 0.1 });

  return (
    <Box
      ref={targetRef}
      component="footer"
      sx={{
        py: 6,
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'center', md: 'flex-start' },
            justifyContent: 'space-between',
            gap: 4,
            mb: 4,
            opacity: isIntersecting ? 1 : 0,
            transform: isIntersecting ? 'translateY(0)' : 'translateY(20px)',
            transition: (t) => t.transitions.create(['opacity', 'transform'], {
              duration: 600,
            }),
          }}
        >
          <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <SchoolIcon sx={{ color: 'primary.main', fontSize: 22 }} />
              <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                CampusConnect
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Built with ♥ at Quaid-i-Azam University
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 2, md: 4 }, justifyContent: 'center' }}>
            {footerLinks.map((link, index) => (
              <Typography
                key={link}
                variant="body2"
                color="text.secondary"
                sx={{ 
                  cursor: 'pointer', 
                  '&:hover': { color: 'primary.main' },
                  opacity: isIntersecting ? 1 : 0,
                  transform: isIntersecting ? 'translateY(0)' : 'translateY(20px)',
                  transition: (t) => t.transitions.create(['opacity', 'transform', 'color'], {
                    duration: 600,
                    delay: 100 + index * 50,
                  }),
                }}
              >
                {link}
              </Typography>
            ))}
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Typography 
          variant="caption" 
          color="text.disabled" 
          display="block" 
          textAlign="center"
          sx={{
            opacity: isIntersecting ? 1 : 0,
            transition: (t) => t.transitions.create(['opacity'], {
              duration: 600,
              delay: 300,
            }),
          }}
        >
          © {new Date().getFullYear()} CampusConnect · Final Year Project, BS Computer Science, QAU
        </Typography>
      </Container>
    </Box>
  );
}