import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export interface KebabMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  color?: 'error' | 'warning' | 'success' | 'inherit';
  disabled?: boolean;
}

interface KebabMenuProps {
  items: KebabMenuItem[];
  size?: 'small' | 'medium';
}

export function KebabMenu({ items, size = 'small' }: KebabMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation(); // prevent card click when opening menu
    setAnchorEl(e.currentTarget);
  };

  const handleClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton size={size} onClick={handleOpen} sx={{ color: 'text.secondary' }}>
        <MoreVertIcon fontSize={size} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleClose()}
        onClick={(e) => e.stopPropagation()}
        slotProps={{
          paper: {
            sx: {
              minWidth: 140,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            },
          },
        }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.label}
            disabled={item.disabled}
            onClick={(e) => {
              e.stopPropagation();
              item.onClick();
              handleClose();
            }}
            sx={{
              color: item.color ? `${item.color}.main` : 'text.primary',
              fontSize: '0.875rem',
              gap: 1,
            }}
          >
            {item.icon && (
              <ListItemIcon sx={{ color: 'inherit', minWidth: 'unset' }}>
                {item.icon}
              </ListItemIcon>
            )}
            <ListItemText primary={item.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}