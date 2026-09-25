import { useNavigate } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import {
  Badge,
  Box,
  Button,
  ButtonBase,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { ChatBubbleOutline, SmartToyOutlined } from "@/shared/icons";
import UserAvatar from "@/shared/components/UserAvatar";
import { ROUTES } from "@/shared/constants/routes";
import { useAuth } from "@/shared/hooks/useAuth";
import { useThreadsQuery } from "@/features/ai-chat/hooks/ai-chat.hooks";
import { useConversationsQuery } from "@/features/chat/hooks/chat-hooks";
import { usePosts } from "@/features/community/hooks/community.hooks";
import {
  useMentorships,
  usePendingRequestCount,
} from "@/features/mentorship/hooks/mentorship.hooks";
import { useResources } from "@/features/resources/hooks/resource.hooks";
import { ResourceRow } from "@/features/resources/components/ResourceRow";
import { useMyProfile } from "@/features/user/hooks/profile-hooks";
import { ApprovalStatus, ResourceSort } from "@/shared/types/enums";
import { HomeEmpty, HomeSection } from "./HomeSection";

const ago = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true });

function RowSkeletons({ count = 3 }: { count?: number }) {
  return (
    <Stack spacing={1} sx={{ px: 1.5, py: 1 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={40} />
      ))}
    </Stack>
  );
}

/** A clickable row: leading visual, title, secondary line, trailing meta. */
function WidgetRow({
  leading,
  title,
  secondary,
  trailing,
  onClick,
  emphasize,
}: {
  leading: React.ReactNode;
  title: string;
  secondary?: string;
  trailing?: React.ReactNode;
  onClick: () => void;
  emphasize?: boolean;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 1.5,
        py: 1,
        borderRadius: 1,
        textAlign: "left",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      {leading}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={emphasize ? 700 : 500} noWrap>
          {title}
        </Typography>
        {secondary && (
          <Typography variant="caption" color="text.tertiary" noWrap display="block">
            {secondary}
          </Typography>
        )}
      </Box>
      {trailing}
    </ButtonBase>
  );
}

// ── Continue: recent AI threads ─────────────────────────────────────────────

export function ContinueWidget() {
  const navigate = useNavigate();
  const { data: threads, isLoading } = useThreadsQuery();
  const recent = (threads ?? []).slice(0, 3);

  if (!isLoading && recent.length === 0) return null;

  return (
    <HomeSection title="Pick up where you left off" action={{ label: "All chats", to: ROUTES.AI_CHAT }} flush>
      {isLoading ? (
        <RowSkeletons count={2} />
      ) : (
        recent.map((t) => (
          <WidgetRow
            key={t.id}
            leading={
              <Box sx={{ width: 32, height: 32, borderRadius: 1, display: "grid", placeItems: "center", bgcolor: "surface.subtle", color: "text.secondary", flexShrink: 0 }}>
                <SmartToyOutlined fontSize="small" />
              </Box>
            }
            title={t.title}
            secondary={`AI chat · ${ago(t.updatedAt)}`}
            onClick={() => navigate(`${ROUTES.AI_CHAT}/${t.id}`)}
          />
        ))
      )}
    </HomeSection>
  );
}

// ── Resources for the student's semester ────────────────────────────────────

export function SemesterResourcesWidget() {
  const navigate = useNavigate();
  const { data: profile } = useMyProfile();
  const semester = profile?.semester;
  const { data, isLoading } = useResources({
    semester,
    status: ApprovalStatus.APPROVED,
    sort: ResourceSort.POPULAR,
  });
  const items = (data?.pages[0]?.data ?? []).slice(0, 5);

  return (
    <HomeSection
      title={semester ? `Popular for semester ${semester}` : "Popular in the library"}
      action={{ label: "Browse library", to: ROUTES.RESOURCES }}
      flush
    >
      {isLoading || !profile ? (
        <RowSkeletons count={4} />
      ) : items.length === 0 ? (
        <HomeEmpty
          action={
            <Button size="small" variant="outlined" onClick={() => navigate(ROUTES.RESOURCES)}>
              Browse all semesters
            </Button>
          }
        >
          Nothing has been shared for semester {semester} yet.
        </HomeEmpty>
      ) : (
        items.map((r) => <ResourceRow key={r._id} resource={r} />)
      )}
    </HomeSection>
  );
}

// ── Mentorship ───────────────────────────────────────────────────────────────

export function MentorshipWidget() {
  const navigate = useNavigate();
  const { data: active, isLoading } = useMentorships("mentee", ["active"]);
  const { data: pending } = useMentorships("mentee", ["pending"]);
  const { data: requestsForMe = 0 } = usePendingRequestCount();
  const mentors = (active?.pages[0]?.data ?? []).slice(0, 3);
  const pendingCount = pending?.pages[0]?.total ?? 0;

  return (
    <HomeSection title="Your mentors" action={{ label: "Mentors", to: ROUTES.MENTORS }} flush>
      {requestsForMe > 0 && (
        <WidgetRow
          leading={<Badge color="primary" variant="dot" sx={{ mx: 1 }}><span /></Badge>}
          title={`${requestsForMe} mentee request${requestsForMe === 1 ? "" : "s"} waiting for you`}
          onClick={() => navigate(ROUTES.MENTORING)}
          emphasize
        />
      )}
      {isLoading ? (
        <RowSkeletons count={2} />
      ) : mentors.length === 0 ? (
        <HomeEmpty
          action={
            <Button size="small" variant="contained" onClick={() => navigate(ROUTES.MENTORS)}>
              Find a mentor
            </Button>
          }
        >
          A senior who has done your course can save you weeks.
        </HomeEmpty>
      ) : (
        mentors.map((m) => (
          <WidgetRow
            key={m.id}
            leading={<UserAvatar name={m.mentor.name} avatar={m.mentor.avatar} size={32} />}
            title={m.mentor.name}
            secondary={m.topic}
            trailing={<ChatBubbleOutline sx={{ fontSize: 18, color: "text.tertiary" }} />}
            onClick={() =>
              navigate(m.conversationId ? `${ROUTES.CHAT}/${m.conversationId}` : ROUTES.MY_MENTORS)
            }
          />
        ))
      )}
      {pendingCount > 0 && (
        <Typography variant="caption" color="text.tertiary" sx={{ display: "block", px: 1.5, pt: 0.5 }}>
          {pendingCount} request{pendingCount === 1 ? "" : "s"} awaiting a reply
        </Typography>
      )}
    </HomeSection>
  );
}

// ── Messages ─────────────────────────────────────────────────────────────────

export function MessagesWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversationsQuery();
  const recent = [...(conversations ?? [])]
    .sort((a, b) => b.unreadCount - a.unreadCount || +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt))
    .slice(0, 3);

  if (!isLoading && recent.length === 0) return null;

  return (
    <HomeSection title="Messages" action={{ label: "Open messages", to: ROUTES.CHAT }} flush>
      {isLoading ? (
        <RowSkeletons count={2} />
      ) : (
        recent.map((c) => {
          const other = c.participants.find((p) => p.id !== user?._id) ?? c.participants[0];
          return (
            <WidgetRow
              key={c.id}
              leading={<UserAvatar name={other?.name} avatar={other?.avatar} size={32} />}
              title={other?.name ?? "Conversation"}
              secondary={c.lastMessage?.content}
              emphasize={c.unreadCount > 0}
              trailing={
                c.unreadCount > 0 ? (
                  <Box component="span" sx={{ minWidth: 20, height: 20, px: 0.75, borderRadius: 10, bgcolor: "primary.main", color: "primary.contrastText", fontSize: "0.6875rem", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    {c.unreadCount}
                  </Box>
                ) : undefined
              }
              onClick={() => navigate(`${ROUTES.CHAT}/${c.id}`)}
            />
          );
        })
      )}
    </HomeSection>
  );
}

// ── Community ────────────────────────────────────────────────────────────────

export function CommunityWidget() {
  const navigate = useNavigate();
  const { data, isLoading } = usePosts();
  const posts = (data?.pages[0]?.data ?? []).slice(0, 3);

  return (
    <HomeSection title="From the community" action={{ label: "Community", to: ROUTES.COMMUNITY }} flush>
      {isLoading ? (
        <RowSkeletons count={3} />
      ) : posts.length === 0 ? (
        <HomeEmpty>No discussions yet — start one in Community.</HomeEmpty>
      ) : (
        posts.map((p) => (
          <WidgetRow
            key={p._id}
            leading={<UserAvatar name={p.author.name} avatar={p.author.avatar} size={32} />}
            title={p.title}
            secondary={`${p.author.name} · ${p.commentCount} ${p.commentCount === 1 ? "reply" : "replies"}`}
            onClick={() => navigate(ROUTES.COMMUNITY)}
          />
        ))
      )}
    </HomeSection>
  );
}
