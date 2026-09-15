
export interface AuthorPost{
    name:string;
    email:string;
}

export interface AuthorComment{
    name:string;
}

export interface Post{
    _id:string;
    title:string;
    content:string;
    author:AuthorPost;
    upvotes:string[];
    commentCount:number;
    isDeleted:boolean;
    updatedAt:string;
    createdAt:string;
}

export interface Comment{
    _id:string;
    content:string;
    author:AuthorComment;
    postId:string;
    isDeleted:boolean;
    createdAt:string;
    updatedAt:string;
}


export interface CreatePostDto{
    title: string;
    content: string;
}

export interface UpdatePostDto{
    title?: string;
    content?:string;
}

export interface CreateCommentDto{
    content:string;
}

export interface UpdateCommentDto{
    content?:string;
}


export interface PostStats{
    total: number; //total posts
    recent: number; //last seven days
}