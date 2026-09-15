import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver';

interface FeatureSpotlightProps {
  illustration: string;
  alt: string;
  eyebrow: string;
  headline: string;
  body: string;
  reverse?: boolean;
  shaded?: boolean;
}

export default function FeatureSpotlight({
  illustration,
  alt,
  eyebrow,
  headline,
  body,
  reverse = false,
  shaded = false,
}: FeatureSpotlightProps) {
  const { isIntersecting, targetRef } = useIntersectionObserver({ threshold: 0.1 });

  return (
    <Box
      ref={targetRef}
      sx={{
        py: { xs: 10, md: 14 },
        bgcolor: shaded ? 'background.paper' : 'background.default',
      }}
    >
      <Container maxWidth="lg">
        <Grid
          container
          spacing={8}
          alignItems="center"
          direction={{ xs: 'column', md: reverse ? 'row-reverse' : 'row' }}
        >
          <Grid 
            size={{xs:12, md:6}}
            sx={{
              opacity: isIntersecting ? 1 : 0,
              transform: isIntersecting ? 'translateY(0)' : 'translateY(20px)',
              transition: (t) => t.transitions.create(['opacity', 'transform'], {
                duration: 600,
                delay: 0,
              }),
            }}
          >
            <Box
              component="img"
              src={illustration}
              alt={alt}
              sx={{
                width: '100%',
                maxWidth: 440,
                display: 'block',
                mx: 'auto',
              }}
            />
          </Grid>
          <Grid 
            size={{xs:12, md:6}}
            sx={{
              opacity: isIntersecting ? 1 : 0,
              transform: isIntersecting ? 'translateY(0)' : 'translateY(20px)',
              transition: (t) => t.transitions.create(['opacity', 'transform'], {
                duration: 600,
                delay: 150,
              }),
            }}
          >
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}
            >
              {eyebrow}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={700}
              mt={1}
              mb={2.5}
              sx={{ letterSpacing: '-0.5px', lineHeight: 1.2 }}
            >
              {headline}
            </Typography>
            <Typography variant="body1" color="text.secondary" lineHeight={1.9}>
              {body}
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}