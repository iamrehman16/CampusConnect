import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver';
import { valueProps } from '../../data/landingContent';

export default function ValueStripSection() {
  const { isIntersecting, targetRef } = useIntersectionObserver({ threshold: 0.1 });

  return (
    <Box ref={targetRef} sx={{ py: { xs: 10, md: 14 }, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          fontWeight={700}
          textAlign="center"
          mb={1}
          sx={{ 
            letterSpacing: '-0.5px',
            opacity: isIntersecting ? 1 : 0,
            transform: isIntersecting ? 'translateY(0)' : 'translateY(20px)',
            transition: (t) => t.transitions.create(['opacity', 'transform'], {
              duration: 600,
              delay: 0,
            }),
          }}
        >
          Everything you need to thrive
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          textAlign="center"
          mb={10}
          sx={{
            opacity: isIntersecting ? 1 : 0,
            transform: isIntersecting ? 'translateY(0)' : 'translateY(20px)',
            transition: (t) => t.transitions.create(['opacity', 'transform'], {
              duration: 600,
              delay: 100,
            }),
          }}
        >
          CampusConnect brings your entire academic life together in one place.
        </Typography>
        <Grid container spacing={6}>
          {valueProps.map((v, index) => (
            <Grid 
              size={{xs:12, md:4}} 
              key={v.title}
              sx={{
                opacity: isIntersecting ? 1 : 0,
                transform: isIntersecting ? 'translateY(0)' : 'translateY(20px)',
                transition: (t) => t.transitions.create(['opacity', 'transform'], {
                  duration: 600,
                  delay: 200 + index * 100,
                }),
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  component="img"
                  src={v.illustration}
                  alt={v.title}
                  sx={{
                    width: '100%',
                    maxWidth: 200,
                    height: 160,
                    objectFit: 'contain',
                    mb: 3,
                    mx: 'auto',
                    display: 'block',
                  }}
                />
                <Typography variant="h6" fontWeight={700} mb={1}>
                  {v.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
                  {v.body}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}