import { forwardRef } from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
// Namespace import keeps export names free to match MUI (Menu, Search…);
// Rollup still tree-shakes unused members.
import * as L from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * App icon set — BACKLOG.md D3/D4. Lucide (thin, consistent 24px grid)
 * replaces @mui/icons-material, which read as "basic corporate".
 *
 * Every icon is exported under the MUI icon name it replaced and keeps the
 * MUI icon prop API (`sx`, `fontSize`, `color`, `htmlColor`,
 * `titleAccess`), so call sites and MUI slots (Button startIcon,
 * ListItemIcon, Chip icon, Badge…) work unchanged. Lucide draws with
 * `currentColor` strokes, so CSS `color` tints it exactly like SvgIcon.
 *
 * New code may import Lucide directly; this file is the single place that
 * decides which glyph means "Messages", "Mentors", etc.
 */

type IconColor =
  | "inherit"
  | "action"
  | "disabled"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning";

export interface AppIconProps {
  sx?: SxProps<Theme>;
  fontSize?: "inherit" | "small" | "medium" | "large";
  color?: IconColor;
  htmlColor?: string;
  titleAccess?: string;
  className?: string;
  strokeWidth?: number;
}

export type AppIcon = React.ForwardRefExoticComponent<
  AppIconProps & React.RefAttributes<SVGSVGElement>
>;

// Same sizes as MUI SvgIcon, so swapping doesn't shift layouts.
const FONT_SIZES = {
  inherit: "inherit",
  small: "1.25rem",
  medium: "1.5rem",
  large: "2.1875rem",
} as const;

const COLORS: Record<IconColor, string | undefined> = {
  inherit: undefined,
  action: "action.active",
  disabled: "action.disabled",
  primary: "primary.main",
  secondary: "secondary.main",
  error: "error.main",
  info: "info.main",
  success: "success.main",
  warning: "warning.main",
};

function adapt(Glyph: LucideIcon, name: string, opts: { filled?: boolean } = {}): AppIcon {
  const Icon = forwardRef<SVGSVGElement, AppIconProps>(function Icon(
    { sx, fontSize = "medium", color = "inherit", htmlColor, titleAccess, className, strokeWidth = 1.75 },
    ref,
  ) {
    return (
      <Box
        component={Glyph}
        ref={ref}
        className={className}
        strokeWidth={strokeWidth}
        absoluteStrokeWidth={false}
        aria-hidden={titleAccess ? undefined : true}
        aria-label={titleAccess}
        role={titleAccess ? "img" : undefined}
        sx={[
          {
            width: "1em",
            height: "1em",
            flexShrink: 0,
            display: "inline-block",
            fontSize: FONT_SIZES[fontSize],
            color: htmlColor ?? COLORS[color],
            fill: opts.filled ? "currentColor" : "none",
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      />
    );
  });
  Icon.displayName = `${name}Icon`;
  return Icon;
}

// Brand marks aren't in Lucide ≥1.0; paths from Simple Icons (CC0).
function brand(path: string, name: string): AppIcon {
  const Icon = forwardRef<SVGSVGElement, AppIconProps>(function Icon(
    { sx, fontSize = "medium", color = "inherit", htmlColor, titleAccess, className },
    ref,
  ) {
    return (
      <Box
        component="svg"
        ref={ref}
        viewBox="0 0 24 24"
        className={className}
        aria-hidden={titleAccess ? undefined : true}
        aria-label={titleAccess}
        role={titleAccess ? "img" : undefined}
        sx={[
          {
            width: "1em",
            height: "1em",
            flexShrink: 0,
            fontSize: FONT_SIZES[fontSize],
            color: htmlColor ?? COLORS[color],
            fill: "currentColor",
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        <path d={path} />
      </Box>
    );
  });
  Icon.displayName = `${name}Icon`;
  return Icon;
}

// ── Navigation & app chrome ────────────────────────────────────────────────
export const Dashboard = adapt(L.LayoutDashboard, "Dashboard");
export const LibraryBooks = adapt(L.Library, "LibraryBooks");
export const SmartToy = adapt(L.Bot, "SmartToy");
export const SmartToyOutlined = adapt(L.Bot, "SmartToyOutlined");
export const Chat = adapt(L.MessageSquare, "Chat");
export const Sms = adapt(L.MessageSquareText, "Sms");
export const Forum = adapt(L.MessagesSquare, "Forum");
export const ForumOutlined = adapt(L.MessagesSquare, "ForumOutlined");
export const People = adapt(L.Users, "People");
export const PeopleOutline = adapt(L.Users, "PeopleOutline");
export const Person = adapt(L.User, "Person");
export const HandshakeOutlined = adapt(L.Handshake, "HandshakeOutlined");
export const AdminPanelSettings = adapt(L.ShieldCheck, "AdminPanelSettings");
export const ManageAccounts = adapt(L.UserCog, "ManageAccounts");
export const HowToReg = adapt(L.UserCheck, "HowToReg");
export const NotificationsNone = adapt(L.Bell, "NotificationsNone");
export const Logout = adapt(L.LogOut, "Logout");
export const Menu = adapt(L.Menu, "Menu");
export const DarkMode = adapt(L.Moon, "DarkMode");
export const LightMode = adapt(L.Sun, "LightMode");
export const InstallMobileRounded = adapt(L.Smartphone, "InstallMobileRounded");
export const WifiOff = adapt(L.WifiOff, "WifiOff");
export const School = adapt(L.GraduationCap, "School");
export const SchoolOutlined = adapt(L.GraduationCap, "SchoolOutlined");
export const BarChart = adapt(L.ChartColumn, "BarChart");
export const EmojiEventsOutlined = adapt(L.Trophy, "EmojiEventsOutlined");
export const Whatshot = adapt(L.Flame, "Whatshot");
export const AutoAwesome = adapt(L.Sparkles, "AutoAwesome");

// ── Arrows & chevrons ──────────────────────────────────────────────────────
export const ArrowBack = adapt(L.ArrowLeft, "ArrowBack");
export const ArrowBackIosNew = adapt(L.ChevronLeft, "ArrowBackIosNew");
export const ArrowForward = adapt(L.ArrowRight, "ArrowForward");
export const ChevronRight = adapt(L.ChevronRight, "ChevronRight");
export const KeyboardArrowDown = adapt(L.ChevronDown, "KeyboardArrowDown");
export const OpenInNew = adapt(L.ExternalLink, "OpenInNew");

// ── Actions ────────────────────────────────────────────────────────────────
export const Add = adapt(L.Plus, "Add");
export const Remove = adapt(L.Minus, "Remove");
export const Close = adapt(L.X, "Close");
export const Edit = adapt(L.Pencil, "Edit");
export const EditOutlined = adapt(L.Pencil, "EditOutlined");
export const Delete = adapt(L.Trash2, "Delete");
export const Save = adapt(L.Save, "Save");
export const Search = adapt(L.Search, "Search");
export const Send = adapt(L.SendHorizontal, "Send");
export const Download = adapt(L.Download, "Download");
export const CloudUpload = adapt(L.CloudUpload, "CloudUpload");
export const ContentCopyRounded = adapt(L.Copy, "ContentCopyRounded");
export const MoreVert = adapt(L.EllipsisVertical, "MoreVert");
export const Stop = adapt(L.Square, "Stop", { filled: true });
export const Visibility = adapt(L.Eye, "Visibility");
export const VisibilityOff = adapt(L.EyeOff, "VisibilityOff");
export const PhotoCamera = adapt(L.Camera, "PhotoCamera");
export const Lock = adapt(L.Lock, "Lock");

// ── Status ─────────────────────────────────────────────────────────────────
export const CheckRounded = adapt(L.Check, "CheckRounded");
export const CheckCircle = adapt(L.CircleCheck, "CheckCircle");
export const CheckCircleOutline = adapt(L.CircleCheck, "CheckCircleOutline");
export const Cancel = adapt(L.CircleX, "Cancel");
export const CancelOutlined = adapt(L.CircleX, "CancelOutlined");
export const ErrorOutline = adapt(L.CircleAlert, "ErrorOutline");
export const HourglassEmpty = adapt(L.Hourglass, "HourglassEmpty");
export const StarRounded = adapt(L.Star, "StarRounded", { filled: true });
// MUI's "ThumbUp"/"*Rounded" were the filled (active) variants.
export const ThumbUp = adapt(L.ThumbsUp, "ThumbUp", { filled: true });
export const ThumbUpRounded = adapt(L.ThumbsUp, "ThumbUpRounded", { filled: true });
export const ThumbUpOutlined = adapt(L.ThumbsUp, "ThumbUpOutlined");
export const ThumbDownRounded = adapt(L.ThumbsDown, "ThumbDownRounded", { filled: true });
export const ThumbDownOutlined = adapt(L.ThumbsDown, "ThumbDownOutlined");

// ── Content & files ────────────────────────────────────────────────────────
export const Article = adapt(L.FileText, "Article");
export const Description = adapt(L.FileText, "Description");
export const PictureAsPdf = adapt(L.FileText, "PictureAsPdf");
export const InsertDriveFile = adapt(L.File, "InsertDriveFile");
export const InsertDriveFileOutlined = adapt(L.File, "InsertDriveFileOutlined");
export const Slideshow = adapt(L.Presentation, "Slideshow");
export const Image = adapt(L.Image, "Image");
export const FolderOutlined = adapt(L.Folder, "FolderOutlined");
export const FolderZip = adapt(L.FolderArchive, "FolderZip");
export const Inbox = adapt(L.Inbox, "Inbox");
export const ChatBubbleOutline = adapt(L.MessageCircle, "ChatBubbleOutline");
export const Email = adapt(L.Mail, "Email");
export const EmailOutlined = adapt(L.Mail, "EmailOutlined");
export const CalendarToday = adapt(L.Calendar, "CalendarToday");

// ── Brands ─────────────────────────────────────────────────────────────────
export const GitHub = brand(
  "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  "GitHub",
);
export const LinkedIn = brand(
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  "LinkedIn",
);
