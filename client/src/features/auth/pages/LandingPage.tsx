import { Box, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { LandingNav } from "../components/landing/LandingNav";
import { ProductShot } from "../components/landing/ProductShot";
import homeShot from "@/assets/screenshots/home.webp";
import askAiShot from "@/assets/screenshots/ask-ai.webp";
import libraryShot from "@/assets/screenshots/library.webp";
import mentorsShot from "@/assets/screenshots/mentors.webp";

const FEATURES = [
  {
    eyebrow: "Ask AI",
    title: "Answers you can check",
    body: "Ask about any course topic. The assistant answers from notes and past papers shared on CampusConnect and shows exactly which document and page it used.",
    shot: { src: askAiShot, alt: "The study assistant answering a question, with the source document listed under the answer", width: 1200, height: 795 },
  },
  {
    eyebrow: "Library",
    title: "Every course, one library",
    body: "Notes, slides and solved past papers from seniors — reviewed before they're published. Filter by course, semester and type, or search.",
    shot: { src: libraryShot, alt: "The resource library, filtered by course, type and semester", width: 1400, height: 801 },
  },
  {
    eyebrow: "Mentors",
    title: "Someone who's done your course",
    body: "Find a senior who knows the subject, send a mentorship request, and chat in real time once they accept. Helping others earns them reputation.",
    shot: { src: mentorsShot, alt: "The mentor directory showing seniors, their topics and free slots", width: 1400, height: 801 },
  },
];

const container = { maxWidth: 1120, mx: "auto", px: { xs: 2, sm: 3 } } as const;

/**
 * Public landing (BACKLOG.md D10): what it is and why, on one screen, then
 * three features shown with real screenshots of the product (captured from
 * the demo data) instead of stock illustrations.
 */
export default function LandingPage() {
  return (
    <Box sx={{ bgcolor: "surface.canvas", minHeight: "100dvh" }}>
      <LandingNav />

      <Box component="main">
        <Box component="section" sx={{ ...container, pt: { xs: 6, md: 10 }, pb: { xs: 6, md: 8 } }}>
          <Box sx={{ maxWidth: 720, mx: "auto", textAlign: "center" }}>
            <Typography variant="overline" color="primary.main" fontWeight={700} sx={{ letterSpacing: "0.1em" }}>
              Built for university students
            </Typography>
            <Typography
              variant="h1"
              sx={{
                mt: 1,
                fontWeight: 700,
                fontSize: { xs: "2.25rem", sm: "3rem", md: "3.5rem" },
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              Your course notes, and an assistant that has read them.
            </Typography>
            <Typography variant="h6" component="p" color="text.secondary" fontWeight={400} sx={{ mt: 2.5, lineHeight: 1.6 }}>
              Seniors share notes, slides and past papers. You ask questions and get answers from them — with the
              source attached. And when you're stuck, a mentor who has taken the course.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} alignItems="center" justifyContent="center" sx={{ mt: 4 }}>
              <Button component={RouterLink} to={ROUTES.SIGNUP} variant="contained" size="large">
                Create a free account
              </Button>
              <Button component={RouterLink} to={ROUTES.LOGIN} variant="outlined" size="large">
                Sign in
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mt: { xs: 6, md: 8 } }}>
            <ProductShot
              src={homeShot}
              alt="The CampusConnect home screen: ask the study assistant, recent chats, popular resources, mentors and messages"
              width={1600}
              height={1000}
              eager
            />
          </Box>
        </Box>

        <Box component="section" aria-label="Features" sx={{ ...container, pb: { xs: 8, md: 12 } }}>
          <Stack spacing={{ xs: 8, md: 12 }}>
            {FEATURES.map((f, i) => (
              <Box
                key={f.eyebrow}
                sx={{
                  display: "grid",
                  gap: { xs: 3, md: 6 },
                  alignItems: "center",
                  gridTemplateColumns: { xs: "minmax(0, 1fr)", md: i % 2 ? "minmax(0, 3fr) minmax(0, 2fr)" : "minmax(0, 2fr) minmax(0, 3fr)" },
                }}
              >
                <Box sx={{ order: { md: i % 2 ? 2 : 1 } }}>
                  <Typography variant="overline" color="primary.main" fontWeight={700} sx={{ letterSpacing: "0.1em" }}>
                    {f.eyebrow}
                  </Typography>
                  <Typography variant="h3" component="h2" sx={{ fontWeight: 700, fontSize: { xs: "1.75rem", md: "2rem" }, letterSpacing: "-0.01em", mt: 0.5 }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>
                    {f.body}
                  </Typography>
                </Box>
                <Box sx={{ order: { md: i % 2 ? 1 : 2 } }}>
                  <ProductShot {...f.shot} />
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box component="section" sx={{ borderTop: "1px solid", borderColor: "border.subtle", bgcolor: "surface.card" }}>
          <Stack alignItems="center" spacing={2} sx={{ ...container, py: { xs: 6, md: 8 }, textAlign: "center" }}>
            <Typography variant="h3" component="h2" sx={{ fontWeight: 700, fontSize: { xs: "1.75rem", md: "2rem" } }}>
              Start with your next exam.
            </Typography>
            <Typography color="text.secondary">Join in a minute. Free for students.</Typography>
            <Button component={RouterLink} to={ROUTES.SIGNUP} variant="contained" size="large">
              Create a free account
            </Button>
          </Stack>
        </Box>
      </Box>

      <Box component="footer" sx={{ borderTop: "1px solid", borderColor: "border.subtle" }}>
        <Typography variant="caption" color="text.tertiary" component="p" sx={{ ...container, py: 3, textAlign: "center" }}>
          CampusConnect · Final Year Project, Quaid-i-Azam University
        </Typography>
      </Box>
    </Box>
  );
}
