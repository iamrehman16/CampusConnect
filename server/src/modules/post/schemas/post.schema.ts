import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true, maxlength: 200 })
  title: string;

  @Prop({ required: true, maxlength: 5000 })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  author: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  upvotes: Types.ObjectId[];

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ default: false, index: true })
  isDeleted: boolean;
}

export type PostDocument = HydratedDocument<Post>;
export const PostSchema = SchemaFactory.createForClass(Post);

// Text index for search
PostSchema.index({ title: 'text', content: 'text' });
