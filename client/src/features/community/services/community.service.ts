import type {
  PaginatedResult,
  PaginationParams,
} from "@/shared/types/api.types";
import type {
  Comment,
  CreateCommentDto,
  CreatePostDto,
  Post,
  PostStats,
  UpdateCommentDto,
  UpdatePostDto,
} from "../types/community.dto";
import api from "@/shared/api/axios.instance";

export class CommunityService {
  async getPosts(params: PaginationParams): Promise<PaginatedResult<Post>> {
    const { data } = await api.get<PaginatedResult<Post>>("/posts", { params });
    return data;
  }

  async getOwnPosts(params: PaginationParams): Promise<PaginatedResult<Post>> {
    const { data } = await api.get<PaginatedResult<Post>>("/posts/my", {
      params,
    });
    return data;
  }

  async getPostsByUser(
    params: PaginationParams,
    id: string,
  ): Promise<PaginatedResult<Post>> {
    const { data } = await api.get<PaginatedResult<Post>>(`/posts/user/${id}`, {
      params,
    });
    return data;
  }

  async getCommentsByPostId(
    postId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Comment>> {
    const { data } = await api.get<PaginatedResult<Comment>>(
      `/posts/${postId}/comments`,
      { params },
    );
    return data;
  }

  async createPost(dto: CreatePostDto): Promise<Post> {
    const { data } = await api.post<Post>("/posts", dto);
    return data;
  }

  async updateOwnPost(postId: string, dto: UpdatePostDto): Promise<Post> {
    const { data } = await api.patch<Post>(`/posts/${postId}`, dto);
    return data;
  }

  async deleteOwnPost(postId: string): Promise<void> {
    await api.delete(`/posts/${postId}`);
  }

  async createComment(postId: string, dto: CreateCommentDto): Promise<Comment> {
    const { data } = await api.post<Comment>(`/posts/${postId}/comments`, dto);
    return data;
  }

  async updateOwnComment(
    commentId: string,
    dto: UpdateCommentDto,
  ): Promise<Comment> {
    const { data } = await api.patch<Comment>(
      `/posts/comments/${commentId}`,
      dto,
    );
    return data;
  }

  async deleteOwnComment(commentId: string): Promise<void> {
    await api.delete(`/posts/comments/${commentId}`);
  }

  async toggleUpvote(postId: string): Promise<Post> {
    const { data } = await api.post<Post>(`/posts/${postId}/upvote`);
    return data;
  }

  async getPostStats(): Promise<PostStats> {
    const { data } = await api.get<PostStats>(`/posts/stats`);
    return data;
  }
}

const communityService = new CommunityService();
export default communityService;
