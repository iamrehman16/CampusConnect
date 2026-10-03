import type { PaginationParams } from "@/shared/types/api.types";
import type { UserRole, UserStatus } from "@/shared/types/enums";


export interface UpdateUserRoleDto{
    role: UserRole;
}

export interface UpdateUserDto{
    name?:string;
    academicInfo?:string;
    expertise?:string[];
    semester?:number;
    avatar?:string;
    isOpenToMentor?:boolean;
    mentorBio?:string;
    mentorTopics?:string[];
    maxActiveMentees?:number;
    showOnLeaderboard?:boolean;
}

export interface UpdateUserStatusDto{
    status:UserStatus;
}

export interface UserFilterParams extends PaginationParams{
    semester?:string;
    role?:UserRole;
    status?:UserStatus;
    search?:string;
}