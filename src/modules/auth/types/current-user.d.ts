import { Roles } from '../../user/enums/user-role.enum';

export type CurrentUser = {
  id: string;
  role: Roles;
  isOnboarded: boolean;
};
