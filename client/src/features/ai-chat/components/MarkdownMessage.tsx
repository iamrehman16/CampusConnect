import { isValidElement, useState, type ReactNode } from "react";
import { Box, IconButton, Tooltip, Typography, Table, TableHead, TableBody, TableRow, TableCell, Link, useTheme } from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownMessageProps {
  content: string;
  isUser?: boolean;
}

// Flattens a fenced code block's rendered children (react-markdown gives
// `pre` a `code` element, whose own children are the raw text, possibly
// split into multiple text nodes) back into the plain string a copy
// button needs — BACKLOG.md C4.
function extractText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement(node)) {
    return extractText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

function CodeBlockCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Tooltip title={copied ? "Copied" : "Copy code"}>
      <IconButton
        size="small"
        onClick={handleCopy}
        className="code-block-copy-btn"
        sx={{
          position: "absolute",
          top: 6,
          right: 6,
          opacity: { xs: 1, md: 0 },
          transition: "opacity 0.15s ease",
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          "&:hover": { bgcolor: "background.paper" },
        }}
      >
        {copied ? (
          <CheckRoundedIcon sx={{ fontSize: 14 }} />
        ) : (
          <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
        )}
      </IconButton>
    </Tooltip>
  );
}

export function MarkdownMessage({ content, isUser = false }: MarkdownMessageProps) {
  const theme = useTheme();

  const components: Components = {
    h1: ({ node, ...props }) => (
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1.5, mb: 0.5 }} {...props} />
    ),
    h2: ({ node, ...props }) => (
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1.5, mb: 0.5 }} {...props} />
    ),
    h3: ({ node, ...props }) => (
      <Typography variant="body1" fontWeight="bold" sx={{ mt: 1.5, mb: 0.5 }} {...props} />
    ),
    h4: ({ node, ...props }) => (
      <Typography variant="body2" fontWeight="bold" sx={{ mt: 1, mb: 0.5 }} {...props} />
    ),
    h5: ({ node, ...props }) => (
      <Typography variant="body2" fontWeight="bold" sx={{ mt: 1, mb: 0.5 }} {...props} />
    ),
    h6: ({ node, ...props }) => (
      <Typography variant="body2" fontWeight="bold" sx={{ mt: 1, mb: 0.5 }} {...props} />
    ),
    strong: ({ node, ...props }) => <Box component="strong" sx={{ fontWeight: 600 }} {...props} />,
    a: ({ node, ...props }) => (
      <Link
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          color: isUser ? "inherit" : "primary.main",
          textDecoration: "none",
          "&:hover": { textDecoration: "underline" },
        }}
      />
    ),
    table: ({ node, ...props }) => (
      <Box sx={{ overflowX: "auto", my: 1 }}>
        <Table
          size="small"
          sx={{
            border: "1px solid",
            borderColor: isUser ? "rgba(255,255,255,0.2)" : "divider",
            "& th, & td": {
              borderColor: isUser ? "rgba(255,255,255,0.2)" : "divider",
            },
          }}
          {...props}
        />
      </Box>
    ),
    thead: ({ node, ...props }) => (
      <TableHead sx={{ bgcolor: isUser ? "rgba(0,0,0,0.1)" : "action.hover" }} {...props} />
    ),
    tbody: ({ node, ...props }) => <TableBody {...props} />,
    tr: ({ node, ...props }) => <TableRow {...props} />,
    th: ({ node, align, ...props }) => (
      <TableCell
        align={align === "char" ? "inherit" : (align ?? undefined)}
        sx={{ fontWeight: "bold", color: isUser ? "inherit" : "text.primary", p: 1 }}
        {...props}
      />
    ),
    td: ({ node, align, ...props }) => (
      <TableCell
        align={align === "char" ? "inherit" : (align ?? undefined)}
        sx={{ color: isUser ? "inherit" : "text.primary", p: 1 }}
        {...props}
      />
    ),
    pre: ({ node, children, ...props }) => (
      <Box
        sx={{
          position: "relative",
          my: 1,
          "&:hover .code-block-copy-btn": { opacity: 1 },
        }}
      >
        <Box
          component="pre"
          sx={{
            bgcolor: isUser
              ? "rgba(0,0,0,0.2)"
              : theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.04)",
            p: 1.5,
            m: 0,
            borderRadius: "8px",
            overflowX: "auto",
            fontFamily: "monospace",
            fontSize: "0.85em",
          }}
          {...props}
        >
          {children}
        </Box>
        <CodeBlockCopyButton text={extractText(children).replace(/\n$/, "")} />
      </Box>
    ),
    code: ({ node, className, ...props }) => {
      return (
        <Box
          component="code"
          className={className}
          sx={{
            bgcolor: isUser
              ? "rgba(255,255,255,0.15)"
              : theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.06)",
            px: 0.5,
            py: 0.25,
            borderRadius: "4px",
            fontFamily: "monospace",
            fontSize: "0.85em",
            "pre &": {
              bgcolor: "transparent",
              p: 0,
              borderRadius: 0,
            },
          }}
          {...props}
        />
      );
    },
  };

  return (
    <Box
      sx={{
        "& p": { my: 0.75, "&:first-of-type": { mt: 0 }, "&:last-of-type": { mb: 0 } },
        "& ul, & ol": { mt: 0.5, mb: 0.5, pl: 2.5 },
        "& li": { mb: 0.25 },
        "& pre": { m: 0 },
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </Box>
  );
}
