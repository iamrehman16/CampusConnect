// features/admin/components/UsersTab.tsx
import { useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
} from "@mui/x-data-grid";
import {
  useUsers,
  useUpdateUserRole,
  useUpdateUserStatus,
} from "@/features/user/hooks/user-hooks";
import { UserRole, UserStatus } from "@/shared/types/enums";
import type { User } from "@/shared/types/auth.types";
import type { UserFilterParams } from "@/features/user/types/user.dto";
import { useDebounce } from "@/shared/hooks/useDebounce";

const PAGE_SIZE = 10;

// ─── Sub-components (defined outside to avoid re-renders) ─────────────────────

interface RoleCellProps {
  user: User;
}

function RoleCell({ user }: RoleCellProps) {
  const { mutate, isPending } = useUpdateUserRole();
  return (
    <Select
      size="small"
      value={user.role}
      disabled={isPending}
      onChange={(e) =>
        mutate({ id: user._id, dto: { role: e.target.value as UserRole } })
      }
      sx={{
        fontSize: 13,
        "& .MuiOutlinedInput-notchedOutline": { border: "none" },
        "& .MuiSelect-select": { py: 0.5 },
      }}
    >
      {Object.values(UserRole).map((r) => (
        <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>
          {r}
        </MenuItem>
      ))}
    </Select>
  );
}

interface StatusCellProps {
  user: User;
}

function StatusCell({ user }: StatusCellProps) {
  const { mutate, isPending } = useUpdateUserStatus();
  const isActive = user.accountStatus === UserStatus.ACTIVE;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Switch
        size="small"
        checked={isActive}
        disabled={isPending}
        onChange={() =>
          mutate({
            id: user._id,
            dto: {
              status: isActive
                ? UserStatus.SUSPENDED
                : UserStatus.ACTIVE,
            },
          })
        }
      />
      <Chip
        label={user.accountStatus}
        size="small"
        color={isActive ? "success" : "error"}
        variant="outlined"
        sx={{ fontSize: 11 }}
      />
    </Box>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

const buildColumns = (): GridColDef<User>[] => [
  {
    field: "name",
    headerName: "Name",
    flex: 1,
    minWidth: 140,
    renderCell: ({ row }) => (
      <Box>
        <Typography variant="body2" fontWeight={500} noWrap>
          {row.name ?? "—"}
        </Typography>
        {row.semester && (
          <Typography variant="caption" color="text.secondary">
            Sem {row.semester}
          </Typography>
        )}
      </Box>
    ),
  },
  {
    field: "email",
    headerName: "Email",
    flex: 1.2,
    minWidth: 180,
    renderCell: ({ value }) => (
      <Typography variant="body2" color="text.secondary" noWrap>
        {value}
      </Typography>
    ),
  },
  {
    field: "role",
    headerName: "Role",
    width: 150,
    sortable: false,
    renderCell: ({ row }) => <RoleCell user={row} />,
  },
  {
    field: "accountStatus",
    headerName: "Status",
    width: 160,
    sortable: false,
    renderCell: ({ row }) => <StatusCell user={row} />,
  },
  {
    field: "contributionScore",
    headerName: "Score",
    width: 90,
    align: "right",
    headerAlign: "right",
    renderCell: ({ value }) => (
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    ),
  },
  {
    field: "createdAt",
    headerName: "Joined",
    width: 110,
    renderCell: ({ value }) => (
      <Typography variant="body2" color="text.secondary">
        {new Date(value).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </Typography>
    ),
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function UsersTab() {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0, // DataGrid is 0-indexed, backend is 1-indexed — we offset below
    pageSize: PAGE_SIZE,
  });

  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const params: UserFilterParams = {
    page: paginationModel.page + 1, // backend is 1-indexed
    limit: PAGE_SIZE,
    ...(roleFilter && { role: roleFilter }),
    ...(statusFilter && { status: statusFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
  };

  const { data, isLoading, isError } = useUsers(params);

  const handlePaginationChange = useCallback((model: GridPaginationModel) => {
    setPaginationModel(model);
  }, []);

  // Reset to page 0 when filters change
  const handleRoleFilter = (value: UserRole | "") => {
    setRoleFilter(value);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleStatusFilter = (value: UserStatus | "") => {
    setStatusFilter(value);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const columns = buildColumns();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Filter bar */}
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <TextField
          size="small"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />

        <Select
          size="small"
          displayEmpty
          value={roleFilter}
          onChange={(e) => handleRoleFilter(e.target.value as UserRole | "")}
          sx={{ minWidth: 130, fontSize: 13 }}
        >
          <MenuItem value="">All roles</MenuItem>
          {Object.values(UserRole).map((r) => (
            <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>
              {r}
            </MenuItem>
          ))}
        </Select>

        <Select
          size="small"
          displayEmpty
          value={statusFilter}
          onChange={(e) =>
            handleStatusFilter(e.target.value as UserStatus | "")
          }
          sx={{ minWidth: 140, fontSize: 13 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {Object.values(UserStatus).map((s) => (
            <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>
              {s}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* DataGrid */}
      <Box sx={{ minWidth: 900, overflowX: "auto" }}>
        {isError ? (
          <Typography color="error" variant="body2">
            Failed to load users. Please refresh.
          </Typography>
        ) : (
          <DataGrid
            rows={data?.data ?? []}
            columns={columns}
            getRowId={(row) => row._id}
            rowCount={data?.total ?? 0}
            loading={isLoading}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationChange}
            pageSizeOptions={[PAGE_SIZE]}
            disableRowSelectionOnClick
            disableColumnFilter
            disableColumnMenu
            rowHeight={56}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "action.hover",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              },
              "& .MuiDataGrid-row:hover": {
                bgcolor: "action.hover",
              },
              "& .MuiDataGrid-cell": {
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
              },
              "& .MuiDataGrid-footerContainer": {
                borderColor: "divider",
              },
              "& .MuiDataGrid-overlay": {
                bgcolor: "background.paper",
              },
            }}
          />
        )}
      </Box>
    </Box>
  );
}
