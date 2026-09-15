import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver';
import AuthCard from '../AuthCard';
import heroIllustration from '@/assets/illustrations/hero.svg';

interface HeroSectionProps {
  authRef: React.RefObject<HTMLDivElement | null>;
}

export default function HeroSection({ authRef }: HeroSectionProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isIntersecting, targetRef } = useIntersectionObserver({ threshold: 0.1 });

  return (
    <Box
      ref={targetRef}
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        pt: { xs: 12, md: 10 },
        pb: { xs: 8, md: 4 },
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          <Grid size={{xs:12, md:6}}>
            <Box
              component="img"
              src={heroIllustration}
              alt="Students collaborating"
              sx={{
                width: '100%',
                maxWidth: 500,
                display: 'block',
                mx: isMobile ? 'auto' : 0,
                mb: 4,
                opacity: isIntersecting ? 1 : 0,
                transform: isIntersecting ? 'translateY(0)' : 'translateY(20px)',
                transition: (t) => t.transitions.create(['opacity', 'transform'], {
                  duration: 800,
                  delay: 100,
                }),
              }}
            />
            <Typography
              variant="h3"
              fontWeight={800}
              sx={{
                lineHeight: 1.15,
                letterSpacing: '-1px',
                fontSize: { xs: '2rem', md: '2.75rem' },
                opacity: isIntersecting ? 1 : 0,
                transform: isIntersecting ? 'translateY(0)' : 'translateY(20px)',
                transition: (t) => t.transitions.create(['opacity', 'transform'], {
                  duration: 800,
                  delay: 200,
                }),
              }}
            >
              Your campus,{' '}
              <Box component="span" sx={{ color: 'primary.main' }}>
                connected.
              </Box>
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              fontWeight={400}
              sx={{ 
                mt: 2, 
                lineHeight: 1.7, 
                maxWidth: 460,
                opacity: isIntersecting ? 1 : 0,
                transform: isIntersecting ? 'translateY(0)' : 'translateY(20px)',
                transition: (t) => t.transitions.create(['opacity', 'transform'], {
                  duration: 800,
                  delay: 300,
                }),
              }}
            >
              Share resources, find mentors, and get AI‑powered help — all in
              one platform built for students.
            </Typography>
          </Grid>

          <Grid
            size={{xs:12, md:6}}
            sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}
          >
            <Box 
              ref={authRef} 
              sx={{ 
                width: '100%', 
                maxWidth: 400,
                opacity: isIntersecting ? 1 : 0,
                transform: isIntersecting ? 'translateY(0)' : 'translateY(20px)',
                transition: (t) => t.transitions.create(['opacity', 'transform'], {
                  duration: 800,
                  delay: 400,
                }),
              }}
            >
              <AuthCard />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}