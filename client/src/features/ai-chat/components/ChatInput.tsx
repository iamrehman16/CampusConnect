// src/features/ai-chat/components/ChatInput.tsx
import { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography, TextField } from '@mui/material';
import { Send as SendIcon, Stop as StopIcon } from "@/shared/icons";

const MAX_CHARS = 1000;

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
  prefillValue?: string;
  onPrefillConsumed?: () => void;
}

export function ChatInput({
  onSend,
  disabled,
  isStreaming,
  onStop,
  prefillValue,
  onPrefillConsumed,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const appliedPrefillRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (prefillValue !== undefined && prefillValue !== appliedPrefillRef.current) {
      appliedPrefillRef.current = prefillValue;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(prefillValue);
      onPrefillConsumed?.();
      textareaRef.current?.focus();
    }
  }, [prefillValue, onPrefillConsumed]);

  // BACKLOG.md C2 — `disabled` now actually locks the textarea (see the
  // TextField prop below), which browsers force-blur on. That's the
  // moment focus needs to come back without a reclick: once the composer
  // re-enables after a response finishes, not only right after the click
  // that sent it (by then the field is already disabled and about to be
  // blurred regardless of what we focus here).
  const wasDisabledRef = useRef(disabled);
  useEffect(() => {
    if (wasDisabledRef.current && !disabled) {
      textareaRef.current?.focus();
    }
    wasDisabledRef.current = disabled;
  }, [disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isOverLimit) return;
    onSend(trimmed);
    setValue('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // If streaming, Enter also stops — feels natural
      if (isStreaming) { onStop?.(); return; }
      handleSend();
    }
  };

  const charCount = value.length;
  const isOverLimit = charCount > MAX_CHARS;
  const showCounter = charCount > MAX_CHARS * 0.8;
  const canSend = value.trim().length > 0 && !disabled && !isOverLimit;

  return (
    <Box>
      {/* D8: one composer surface — the field and its send/stop button share
          a single bordered box, instead of a pill field plus a floating
          circle button. */}
      <Box
        sx={(t) => ({
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          pl: 2,
          pr: 1,
          py: 1,
          borderRadius: `${t.radius.lg}px`,
          border: '1px solid',
          borderColor: isOverLimit ? 'error.main' : 'border.default',
          bgcolor: disabled ? 'surface.subtle' : 'surface.card',
          boxShadow: t.palette.mode === 'dark' ? 'none' : '0 1px 2px rgba(28, 25, 23, 0.04)',
          transition: t.transitions.create(['border-color', 'box-shadow', 'background-color']),
          '&:focus-within': {
            borderColor: isOverLimit ? 'error.main' : 'primary.main',
            boxShadow: `0 0 0 3px ${t.palette.primary.subtle}`,
          },
        })}
      >
        <TextField
          fullWidth
          multiline
          maxRows={6}
          disabled={disabled}
          placeholder={isStreaming ? 'Responding…' : 'Ask about any course topic…'}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          variant="standard"
          inputRef={textareaRef}
          slotProps={{
            input: { disableUnderline: true },
            htmlInput: { 'aria-label': 'Message the study assistant' },
          }}
          sx={{
            py: 0.75,
            '& .MuiInputBase-root': { fontSize: '0.9375rem', lineHeight: 1.6 },
            // BACKLOG.md C2 — the composer visibly locks while streaming.
            '& .Mui-disabled': { opacity: 0.7 },
          }}
        />

        {isStreaming ? (
          <IconButton
            onClick={onStop}
            aria-label="Stop response"
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              bgcolor: 'text.primary',
              color: 'surface.card',
              '&:hover': { bgcolor: 'text.secondary', color: 'surface.card' },
            }}
          >
            <StopIcon sx={{ fontSize: 14 }} />
          </IconButton>
        ) : (
          <IconButton
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send message"
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { bgcolor: 'primary.dark', color: 'primary.contrastText' },
              '&.Mui-disabled': { bgcolor: 'surface.subtle', color: 'text.disabled' },
            }}
          >
            <SendIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 0.75,
          px: 0.5,
        }}
      >
        <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.tertiary' }}>
          Enter to send · Shift+Enter for a new line · Answers can be wrong — check the cited sources
        </Typography>

        {showCounter && (
          <Typography
            variant="caption"
            sx={{
              textAlign: 'right',
              color: isOverLimit ? 'error.main' : 'text.secondary',
              fontWeight: isOverLimit ? 600 : 400,
            }}
          >
            {charCount} / {MAX_CHARS}
          </Typography>
        )}
      </Box>
    </Box>
  );
}