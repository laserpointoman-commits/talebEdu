import { z } from 'zod';

// Validation schemas for database inputs
export const notificationSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  message: z.string().trim().min(1, 'Message is required').max(1000, 'Message must be less than 1000 characters'),
});

export const checkpointLogSchema = z.object({
  student_name: z.string().trim().min(1, 'Student name is required').max(200, 'Student name must be less than 200 characters'),
  location: z.string().trim().max(500, 'Location must be less than 500 characters').optional(),
  nfc_id: z.string().trim().max(100, 'NFC ID must be less than 100 characters').optional(),
});

export const messageSchema = z.object({
  subject: z.string().trim().max(200, 'Subject must be less than 200 characters').optional(),
  content: z.string().trim().min(1, 'Message content is required').max(5000, 'Message must be less than 5000 characters'),
});

export const postSchema = z.object({
  content: z.string().trim().min(1, 'Post content is required').max(2000, 'Post must be less than 2000 characters'),
  image_url: z.string().url('Invalid image URL').max(1000, 'URL must be less than 1000 characters').optional().nullable(),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1, 'Comment is required').max(1000, 'Comment must be less than 1000 characters'),
});

// Validation helpers
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: string } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Validation failed' };
  }
};
