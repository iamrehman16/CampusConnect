import { useState } from "react";
import {
  Box,
  IconButton,
  ListItemButton,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { formatDistanceToNow } from "date-fns";
import type { AiConversationThread } from "../types/ai-chat.dto";

interface ThreadListItemProps {
  thread: AiConversationThread;
  isActive: boolean;
  onClick: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

export function ThreadListItem({
  thread,
  isActive,
  onClick,
  onRename,
  onDelete,
}: ThreadListItemProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(thread.title);

  const commitRename = () => {
    const trimmed = draftTitle.trim();
    setIsRenaming(false);
    if (trimmed && trimmed !== thread.title) {
      onRename(trimmed);
    } else {
      setDraftTitle(thread.title);
    }
  };

  if (isRenaming) {
    return (
      <Box sx={{ px: 2, py: 1 }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") {
              setDraftTitle(thread.title);
              setIsRenaming(false);
            }
          }}
        />
      </Box>
    );
  }

  return (
    <ListItemButton
      onClick={onClick}
      selected={isActive}
      sx={{
        px: 2,
        py: 1.25,
        gap: 1,
        "&.Mui-selected": { bgcolor: "action.selected" },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {thread.title}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap display="block">
          {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
        </Typography>
      </Box>

      <IconButton
        size="small"
        edge="end"
        aria-label="Thread options"
        onClick={(e) => {
          e.stopPropagation();
          setMenuAnchor(e.currentTarget);
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            setDraftTitle(thread.title);
            setIsRenaming(true);
          }}
        >
          Rename
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onDelete();
          }}
          sx={{ color: "error.main" }}
        >
          Delete
        </MenuItem>
      </Menu>
    </ListItemButton>
  );
}
