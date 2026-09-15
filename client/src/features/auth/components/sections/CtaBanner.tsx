import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useIntersectionObserver } from "@/shared/hooks/useIntersectionObserver";

interface CtaBannerProps {
  onJoin: () => void;
}

export default function CtaBanner({ onJoin }: CtaBannerProps) {
  const { isIntersecting, targetRef } = useIntersectionObserver({
    threshold: 0.1,
  });

  return (
    <Box
      ref={targetRef}
      sx={{
        py: { xs: 12, md: 16 },
        bgcolor: "primary.main",
        textAlign: "center",
        position: "relative",
      }}
    >
      <Container maxWidth="sm">
        <Typography
          variant="h3"
          fontWeight={800}
          sx={{
            color: "primary.contrastText",
            letterSpacing: "-1px",
            mb: 2,
            opacity: isIntersecting ? 1 : 0,
            transform: isIntersecting ? "translateY(0)" : "translateY(20px)",
            transition: (t) =>
              t.transitions.create(["opacity", "transform"], {
                duration: 600,
                delay: 0,
              }),
          }}
        >
          Ready to connect?
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: "primary.contrastText",
            mb: 6,
            fontWeight: 400,
            lineHeight: 1.6,
            opacity: isIntersecting ? 0.75 : 0,
            transform: isIntersecting ? "translateY(0)" : "translateY(20px)",
            transition: (t) =>
              t.transitions.create(["opacity", "transform"], {
                duration: 600,
                delay: 100,
              }),
          }}
        >
          Join thousands of students already using CampusConnect to learn faster
          and go further.
        </Typography>

        <Box
          sx={{
            display: "inline-block",
            opacity: isIntersecting ? 1 : 0,
            transform: isIntersecting ? "translateY(0)" : "translateY(20px)",
            transition: (t) =>
              t.transitions.create(["opacity", "transform"], {
                duration: t.transitions.duration.standard,
                delay: 200,
              }),
          }}
        >
          <Button
            variant="outlined"
            size="large"
            onClick={onJoin}
            sx={{
              bgcolor: "#ffffff !important",
              color: "primary.main",
              fontWeight: 700,
              borderRadius: 2,
              px: 5,
              py: 1.5,
              fontSize: "1rem",
              textTransform: "none",
              boxShadow: "0 10px 32px rgba(0,0,0,0.2)",
              "&:hover": {
                bgcolor: "#f0f0f0 !important",
                transform: "translateY(-2px)",
                boxShadow: "0 16px 48px rgba(0,0,0,0.25)",
              },
              "&:active": {
                transform: "translateY(0)",
              },
            }}
          >
            Get started — it's free
          </Button>
        </Box>
      </Container>
    </Box>
  );
}