import { Box, Typography, Stack, Chip, Divider, Avatar, IconButton } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { PageContainer } from "@/shared/components/PageContainer";
import { FAQ_SECTIONS, CREATOR } from "../data/faq.data";
import { FaqItem } from "../components/FaqItem";

// ─── Sub-Component: Hero ─────────────────────────────────────────────────────
function HeroSection() {
  return (
    <Box sx={{ mb: { xs: 5, sm: 7 } }}>
      <Stack direction="row" alignItems="center" gap={1} mb={2}>
        <AutoAwesomeIcon sx={{ fontSize: 16, color: "primary.light" }} />
        <Typography
          variant="caption"
          fontWeight={700}
          color="primary.light"
          textTransform="uppercase"
          letterSpacing={1.2}
        >
          CampusConnect
        </Typography>
      </Stack>

      <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.25, mb: 1.5 }}>
        Your campus. <br />
        <Typography
          component="span"
          variant="h4"
          fontWeight={700}
          fontStyle="italic"
          sx={{ color: "primary.light" }}
        >
          Smarter, together.
        </Typography>
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, lineHeight: 1.8 }}>
        CampusConnect is a student-built academic collaboration platform — bringing resources,
        community, AI assistance, and real-time chat under one roof. Everything you need to study
        better, share more, and connect with your peers.
      </Typography>
    </Box>
  );
}

// ─── Sub-Component: FAQ Loop ──────────────────────────────────────────────────
function FaqList() {
  return (
    <Box sx={{ mb: { xs: 6, sm: 8 } }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
        Frequently Asked Questions
      </Typography>

      <Stack spacing={4}>
        {FAQ_SECTIONS.map((section) => (
          <Box key={section.section}>
            <Chip
              label={section.section}
              size="small"
              sx={{
                mb: 1.5,
                fontWeight: 600,
                fontSize: "0.7rem",
                bgcolor: "action.selected",
                color: "text.secondary",
                borderRadius: 1.5,
              }}
            />
            <Divider sx={{ mb: 0.5, opacity: 0.4 }} />
            {section.items.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

// ─── Sub-Component: Creator Card ──────────────────────────────────────────────
function CreatorCard() {
  return (
    <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: { xs: 4, sm: 5 } }}>
      <Typography
        variant="caption"
        fontWeight={700}
        color="text.disabled"
        textTransform="uppercase"
        letterSpacing={1}
        display="block"
        mb={2.5}
      >
        Built by
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={2.5}
      >
        <Stack direction="row" alignItems="center" gap={2}>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              bgcolor: "primary.dark",
              color: "primary.light",
              fontSize: "1rem",
              fontWeight: 700,
            }}
          >
            {CREATOR.initials}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.3}>
              {CREATOR.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {CREATOR.role}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" gap={1}>
          {CREATOR.links.map(({ icon, label, href }) => (
            <IconButton
              key={label}
              component="a"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              aria-label={label}
              sx={{
                color: "text.secondary",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                p: 0.875,
                transition: "color 0.15s ease, border-color 0.15s ease",
                "&:hover": {
                  color: "primary.light",
                  borderColor: "primary.main",
                  bgcolor: "transparent",
                },
              }}
            >
              {icon}
            </IconButton>
          ))}
        </Stack>
      </Stack>

      <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 4, textAlign: "center" }}>
        CampusConnect · Final Year Project · Quaid-i-Azam University · {new Date().getFullYear()}
      </Typography>
    </Box>
  );
}

// ─── Main Page Export ─────────────────────────────────────────────────────────
export default function FaqPage() {
  return (
    <PageContainer>
      <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 }, maxWidth: 800, mx: "auto" }}>
        <HeroSection />
        <FaqList />
        <CreatorCard />
      </Box>
    </PageContainer>
  );
}