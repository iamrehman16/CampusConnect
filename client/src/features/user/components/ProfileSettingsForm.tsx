import React, { useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Save } from "@/shared/icons";
import type { UpdateUserDto } from "../types/user.dto";
import {
  DEFAULT_MAX_ACTIVE_MENTEES,
  MAX_MENTOR_TOPICS,
  type ProfileUserViewModel,
} from "../types/profile.types";

interface ProfileSettingsFormProps {
  user: ProfileUserViewModel | null;
  onSave: (dto: UpdateUserDto) => void;
  isSaving: boolean;
  /** Rendered at the top of the Profile section (avatar picker). */
  avatarSlot?: React.ReactNode;
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const CAPACITIES = Array.from({ length: 10 }, (_, i) => i + 1);

/** Mirrors the server's ArrayMaxSize on expertise. */
const MAX_SKILLS = 20;

const cleanTags = (values: string[], max: number) =>
  Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).slice(0, max);

const sameTopics = (a: string[], b: string[]) =>
  a.length === b.length && a.every((t, i) => t === b[i]);

const ProfileSettingsForm: React.FC<ProfileSettingsFormProps> = ({
  user,
  onSave,
  isSaving,
  avatarSlot,
}) => {
  const [form, setForm] = useState({
    name: user?.name ?? "",
    academicInfo: user?.academicInfo ?? "",
    expertise: user?.expertiseTags ?? ([] as string[]),
    semester: user?.semester ?? "",
    isOpenToMentor: user?.isOpenToMentor ?? false,
    mentorBio: user?.mentorBio ?? "",
    mentorTopics: user?.mentorTopics ?? ([] as string[]),
    maxActiveMentees: user?.maxActiveMentees ?? DEFAULT_MAX_ACTIVE_MENTEES,
  });
  // Tracks which user id `form` was last synced from, so the form resets
  // once the initially-null user data loads (adjusting state during render,
  // not in an Effect, per React's "you might not need an effect" guidance).
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null);

  if (user && user.id !== syncedUserId) {
    setSyncedUserId(user.id);
    setForm({
      name: user.name ?? "",
      academicInfo: user.academicInfo ?? "",
      expertise: user.expertiseTags ?? [],
      semester: user.semester ?? "",
      isOpenToMentor: user.isOpenToMentor,
      mentorBio: user.mentorBio ?? "",
      mentorTopics: user.mentorTopics,
      maxActiveMentees: user.maxActiveMentees,
    });
  }

  const isDirty =
    form.name !== (user?.name ?? "") ||
    form.academicInfo !== (user?.academicInfo ?? "") ||
    !sameTopics(form.expertise, user?.expertiseTags ?? []) ||
    Number(form.semester) !== (user?.semester ?? 0) ||
    form.isOpenToMentor !== (user?.isOpenToMentor ?? false) ||
    form.mentorBio !== (user?.mentorBio ?? "") ||
    !sameTopics(form.mentorTopics, user?.mentorTopics ?? []) ||
    form.maxActiveMentees !==
      (user?.maxActiveMentees ?? DEFAULT_MAX_ACTIVE_MENTEES);

  const handleChange =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = () => {
    const dto: UpdateUserDto = {};
    if (form.name.trim()) dto.name = form.name.trim();
    if (form.academicInfo !== (user?.academicInfo ?? "")) {
      dto.academicInfo = form.academicInfo.trim();
    }
    if (!sameTopics(form.expertise, user?.expertiseTags ?? [])) {
      dto.expertise = form.expertise;
    }
    if (form.semester) dto.semester = Number(form.semester);
    if (form.isOpenToMentor !== (user?.isOpenToMentor ?? false)) {
      dto.isOpenToMentor = form.isOpenToMentor;
    }
    if (form.mentorBio !== (user?.mentorBio ?? "")) {
      dto.mentorBio = form.mentorBio.trim();
    }
    if (!sameTopics(form.mentorTopics, user?.mentorTopics ?? [])) {
      dto.mentorTopics = form.mentorTopics;
    }
    if (
      form.maxActiveMentees !==
      (user?.maxActiveMentees ?? DEFAULT_MAX_ACTIVE_MENTEES)
    ) {
      dto.maxActiveMentees = form.maxActiveMentees;
    }
    onSave(dto);
  };

  return (
    <Stack spacing={3}>
      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <SectionTitle
          title="Profile"
          subtitle="Shown on your profile, posts and the mentor directory."
        />
        {avatarSlot}
        <Stack spacing={2.5}>
          <TextField
            label="Display name"
            value={form.name}
            onChange={handleChange("name")}
            fullWidth
            size="small"
            required
            error={!form.name.trim()}
            helperText={!form.name.trim() ? "Your name can't be empty" : undefined}
            slotProps={{ htmlInput: { maxLength: 60 } }}
          />
          <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" } }}>
            <TextField
              label="Programme"
              placeholder="e.g. BS Computer Science"
              value={form.academicInfo}
              onChange={handleChange("academicInfo")}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { maxLength: 120 } }}
            />
            <TextField
              select
              label="Semester"
              value={form.semester}
              onChange={handleChange("semester")}
              fullWidth
              size="small"
            >
              <MenuItem value="">
                <em>Not specified</em>
              </MenuItem>
              {SEMESTERS.map((s) => (
                <MenuItem key={s} value={s}>
                  Semester {s}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Autocomplete
            multiple
            freeSolo
            options={[] as string[]}
            value={form.expertise}
            onChange={(_, value) =>
              setForm((prev) => ({ ...prev, expertise: cleanTags(value, MAX_SKILLS) }))
            }
            renderTags={(value, getTagProps) =>
              value.map((skill, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return <Chip key={key} label={skill} size="small" {...tagProps} />;
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Skills"
                placeholder="Type a skill and press Enter"
                size="small"
              />
            )}
          />
        </Stack>
      </Card>

      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <SectionTitle
          title="Mentoring"
          subtitle="Juniors can find you in the mentor directory and send you requests."
        />
        <FormControlLabel
          control={
            <Switch
              checked={form.isOpenToMentor}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isOpenToMentor: e.target.checked }))
              }
            />
          }
          label="I'm open to mentoring other students"
        />

        {form.isOpenToMentor && (
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <TextField
              label="What can you help with?"
              value={form.mentorBio}
              onChange={handleChange("mentorBio")}
              fullWidth
              multiline
              minRows={3}
              size="small"
              slotProps={{ htmlInput: { maxLength: 500 } }}
              helperText={`${form.mentorBio.length}/500`}
            />

            <Autocomplete
              multiple
              freeSolo
              options={[] as string[]}
              value={form.mentorTopics}
              onChange={(_, value) =>
                setForm((prev) => ({
                  ...prev,
                  mentorTopics: cleanTags(value, MAX_MENTOR_TOPICS),
                }))
              }
              renderTags={(value, getTagProps) =>
                value.map((topic, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return <Chip key={key} label={topic} size="small" {...tagProps} />;
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Topics you mentor on"
                  placeholder="Type a subject or course and press Enter"
                  size="small"
                  helperText={`Up to ${MAX_MENTOR_TOPICS} topics · ${form.mentorTopics.length} added`}
                />
              )}
            />

            <TextField
              select
              label="Maximum mentees at a time"
              value={form.maxActiveMentees}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  maxActiveMentees: Number(e.target.value),
                }))
              }
              size="small"
              sx={{ maxWidth: 240 }}
            >
              {CAPACITIES.map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        )}
      </Card>

      <Stack direction="row" justifyContent="flex-end" alignItems="center" gap={2}>
        {isDirty && (
          <Typography variant="caption" color="text.tertiary">
            Unsaved changes
          </Typography>
        )}
        <Button
          variant="contained"
          startIcon={isSaving ? <CircularProgress size={16} sx={{ color: "inherit" }} /> : <Save />}
          onClick={handleSubmit}
          disabled={!isDirty || isSaving || !form.name.trim()}
        >
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
      </Stack>
    </Stack>
  );
};

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="subtitle1" fontWeight={600}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </Box>
  );
}

export default ProfileSettingsForm;
