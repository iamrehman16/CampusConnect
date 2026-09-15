import React from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  IconButton,
} from "@mui/material";
import {
  CalendarToday,
  School,
  CheckCircle,
  HourglassEmpty,
  Cancel,
  Article,
  PhotoCamera,
} from "@mui/icons-material";
import { UserRole } from "@/shared/types/enums";
import type {
  ProfileStats,
  ProfileUserViewModel,
} from "../types/profile.types";

interface ProfileHeroProps {
  user: ProfileUserViewModel | null;
  stats?: ProfileStats;
  isLoading?: boolean;
  /** Slot for action buttons (Edit button on private, nothing on public) */
  actions?: React.ReactNode;
  /** If provided, clicking the avatar will open the avatar chooser */
  onAvatarClick?: () => void;
}

const StatBox = ({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: { xs: 0.25, sm: 0.5 },
      px: { xs: 0.75, sm: 2 },
      py: { xs: 0.75, sm: 1.5 },
      borderRadius: 2,
      bgcolor: "action.hover",
      border: "1px solid",
      borderColor: "divider",
      minWidth: { xs: 0, sm: 80 },
      flex: { xs: 1, sm: 'unset' },
    }}
  >
    <Box sx={{ color, display: "flex", alignItems: "center" }}>{icon}</Box>
    <Typography
      variant="h6"
      fontWeight={700}
      sx={{ color: "text.primary", lineHeight: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}
    >
      {value}
    </Typography>
    <Typography
      variant="caption"
      sx={{ color: "text.secondary", fontSize: { xs: "0.6rem", sm: "0.65rem" }, textAlign: "center" }}
    >
      {label}
    </Typography>
  </Box>
);

const ProfileHero: React.FC<ProfileHeroProps> = ({
  user,
  stats,
  isLoading,
  actions,
  onAvatarClick,
}) => {
  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Card
      sx={{
        borderRadius: { xs: 0, sm: 3 },
        mb: 0,
        bgcolor: "background.paper",
        border: { xs: 0, sm: "1px solid" },
        borderColor: { sm: "divider" },
        boxShadow: "none",
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Top row: avatar + info + actions */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1, sm: 2 }}
          alignItems={{ xs: 'center', sm: 'flex-start' }}
        >
          {isLoading ? (
            <Skeleton variant="circular" width={64} height={64} />
          ) : (
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <Avatar
                src={user?.avatar ?? undefined}
                alt={user?.name}
                sx={{
                  width: { xs: 72, sm: 72 },
                  height: { xs: 72, sm: 72 },
                  fontSize: { xs: '1.75rem', sm: '1.75rem' },
                  fontWeight: 700,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  flexShrink: 0,
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              {onAvatarClick && (
                <IconButton
                  size="small"
                  onClick={onAvatarClick}
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    width: 32,
                    height: 32,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 1,
                    '&:hover': {
                      bgcolor: 'background.paper',
                    },
                  }}
                >
                  <PhotoCamera fontSize="small" />
                </IconButton>
              )}
            </Box>
          )}

          {/* Name / meta */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              width: '100%',
            }}
          >
            {isLoading ? (
              <>
                <Skeleton width={160} height={28} sx={{ mb: 0.5 }} />
                <Skeleton width={180} height={18} />
              </>
            ) : (
              <>
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  justifyContent={{ xs: 'center', sm: 'space-between' }}
                  spacing={1}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.75}
                      flexWrap="wrap"
                      justifyContent={{ xs: 'center', sm: 'flex-start' }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{ lineHeight: 1.2, textAlign: { xs: 'center', sm: 'left' } }}
                      >
                        {user?.name}
                      </Typography>
                      {user?.role && (
                        <Chip
                          label={user.role}
                          size="small"
                          variant="outlined"
                          color={user.role === UserRole.ADMIN ? 'primary' : 'default'}
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            borderColor: user.role === UserRole.ADMIN ? 'primary.main' : 'divider',
                            color: user.role === UserRole.ADMIN ? 'primary.main' : 'text.secondary',
                          }}
                        />
                      )}
                    </Stack>
                    {joinDate && (
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.5}
                        justifyContent={{ xs: 'center', sm: 'flex-start' }}
                        sx={{ mt: 0.5 }}
                      >
                        <CalendarToday sx={{ fontSize: 12, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">
                          Joined {joinDate}
                        </Typography>
                      </Stack>
                    )}
                  </Box>

                  {actions && (
                    <Box sx={{ flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
                      {actions}
                    </Box>
                  )}
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  justifyContent={{ xs: 'center', sm: 'flex-start' }}
                  sx={{ mt: 0.75 }}
                >
                  {(user?.academicInfo || user?.semester) && (
                    <Chip
                      icon={<School sx={{ fontSize: 14 }} />}
                      label={`${user?.academicInfo ?? "Academic info not set"}${
                        user?.semester ? ` · Sem ${user.semester}` : ""
                      }`}
                      size="small"
                      variant="outlined"
                      sx={{ maxWidth: "100%" }}
                    />
                  )}
                </Stack>

                {user?.expertiseTags?.length ? (
                  <Stack
                    direction="row"
                    flexWrap="wrap"
                    gap={1}
                    justifyContent={{ xs: 'center', sm: 'flex-start' }}
                    sx={{ mt: 1 }}
                  >
                    {user.expertiseTags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                  </Stack>
                ) : null}

                {user?.interests?.length ? (
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 1, textAlign: { xs: 'center', sm: 'left' } }}
                    >
                      Interests
                    </Typography>
                    <Stack
                      direction="row"
                      flexWrap="wrap"
                      gap={1}
                      justifyContent={{ xs: 'center', sm: 'flex-start' }}
                    >
                      {user.interests.map((interest) => (
                        <Chip
                          key={interest}
                          label={interest}
                          size="small"
                          variant="filled"
                          sx={{ fontSize: '0.75rem', bgcolor: 'action.selected' }}
                        />
                      ))}
                    </Stack>
                  </Box>
                ) : null}
              </>
            )}
          </Box>
        </Stack>

        {/* Actions — shown on xs only, below content */}
        {actions && (
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'center', mt: 1.5 }}>
            {actions}
          </Box>
        )}

        <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />

        <Stack
          direction="row"
          spacing={{ xs: 0.75, sm: 1 }}
          justifyContent="stretch"
          sx={{ width: '100%' }}
        >
          {isLoading ? (
            [0, 1, 2, 3].map((i) => (
              <Box key={i} sx={{ flex: 1 }}>
                <Skeleton variant="rounded" width="100%" height={64} />
              </Box>
            ))
          ) : (
            <>
              <Tooltip title="Total posts" arrow>
                <span>
                  <StatBox
                    icon={<Article sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                    value={stats?.totalPosts ?? 0}
                    label="Posts"
                    color="primary.main"
                  />
                </span>
              </Tooltip>
              <Tooltip title="Approved resources" arrow>
                <span>
                  <StatBox
                    icon={<CheckCircle sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                    value={stats?.approvedResources ?? 0}
                    label="Approved"
                    color="success.main"
                  />
                </span>
              </Tooltip>
              <Tooltip title="Pending review" arrow>
                <span>
                  <StatBox
                    icon={<HourglassEmpty sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                    value={stats?.pendingResources ?? 0}
                    label="Pending"
                    color="warning.main"
                  />
                </span>
              </Tooltip>
              <Tooltip title="Rejected resources" arrow>
                <span>
                  <StatBox
                    icon={<Cancel sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                    value={stats?.rejectedResources ?? 0}
                    label="Rejected"
                    color="error.main"
                  />
                </span>
              </Tooltip>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ProfileHero;
