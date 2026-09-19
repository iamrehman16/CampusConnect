// src/features/ai-chat/components/ChatInput.tsx
import { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography, TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';

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
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          disabled={disabled}
          placeholder={isStreaming ? 'Responding…' : 'Ask a question…'}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          variant="outlined"
          size="small"
          inputRef={textareaRef}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '24px',
              bgcolor: 'background.paper',
              transition: 'opacity 0.15s ease',
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: isOverLimit ? 'error.main' : 'primary.light',
                borderWidth: '1.5px',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isOverLimit ? 'error.main' : undefined,
              },
              // BACKLOG.md C2 — `disabled` prop existed on this component
              // already but was never wired to the field, so streaming
              // never visibly locked the composer. MUI's disabled cursor
              // + text opacity aren't enough on their own to read as
              // "can't type right now" rather than "form field, but
              // muted" — the extra opacity on the whole control makes it
              // unambiguous.
              '&.Mui-disabled': {
                opacity: 0.6,
                bgcolor: 'action.disabledBackground',
              },
            },
          }}
        />

        {/* Send / Stop toggle */}
        {isStreaming ? (
          <IconButton
            size="small"
            onClick={onStop}
            aria-label="Stop response"
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              mb: 0.25,
              bgcolor: 'error.main',
              color: '#fff',
              borderRadius: '50%',
              '&:hover': { bgcolor: 'error.dark' },
            }}
          >
            <StopIcon sx={{ fontSize: 18 }} />
          </IconButton>
        ) : (
          <IconButton
            size="small"
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send message"
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              mb: 0.25,
              bgcolor: canSend ? 'primary.main' : 'action.disabledBackground',
              color: canSend ? 'primary.contrastText' : 'text.disabled',
              borderRadius: '50%',
              '&:hover': {
                bgcolor: canSend ? 'primary.dark' : 'action.disabledBackground',
              },
              '&.Mui-disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'text.disabled',
              },
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
          mt: 0.5,
          px: 0.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: { xs: 'none', sm: 'block' },
            color: 'text.disabled',
            fontSize: '0.7rem',
          }}
        >
          Enter to send · Shift+Enter for new line
        </Typography>

        {showCounter && (
          <Typography
            variant="caption"
            sx={{
              textAlign: 'right',
              color: isOverLimit ? 'error.main' : 'text.secondary',
              fontWeight: isOverLimit ? 600 : 400,
              transition: 'color 0.15s',
            }}
          >
            {charCount} / {MAX_CHARS}
          </Typography>
        )}
      </Box>
    </Box>
  );
}