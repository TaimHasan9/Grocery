import { z } from 'zod';

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, 'Full name is required'),
  customerEmail: z.string().trim().email('Valid email address is required'),
  customerPhone: z
    .string()
    .trim()
    .min(7, 'Phone number must be at least 7 digits')
    .max(24, 'Phone number is too long'),
  street: z.string().trim().min(4, 'Street address is required'),
  city: z.string().trim().min(2, 'City is required'),
  postalCode: z.string().trim().min(3, 'Postal code is required'),
  paymentMethod: z.enum(['cod', 'stripe']),
  couponCode: z.string().trim().optional().default(''),
  notes: z.string().trim().max(400).optional().default(''),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export const addressSchema = z.object({
  label: z.string().trim().min(1, 'Label is required').max(30),
  recipientName: z.string().trim().min(2, 'Recipient name is required'),
  phone: z.string().trim().min(7, 'Valid phone number is required'),
  street: z.string().trim().min(4, 'Street address is required'),
  city: z.string().trim().min(2, 'City is required'),
  postalCode: z.string().trim().min(3, 'Postal code is required'),
  isDefault: z.boolean().optional().default(false),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Your name is required'),
  email: z.string().trim().email('Valid email is required'),
  subject: z.string().trim().min(3, 'Subject is required'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters'),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required'),
  sku: z.string().trim().min(2, 'SKU is required'),
  storeName: z.string().trim().min(2).default('Local shop'),
  categoryId: z.coerce.number().int().positive('Category is required'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  unitWeight: z.string().trim().min(1, 'Weight or quantity is required'),
  priceCents: z.coerce.number().int().positive('Price must be greater than zero'),
  originalPriceCents: z.coerce.number().int().nonnegative().nullable().optional(),
  discountPercent: z.coerce.number().int().min(0).max(95).default(0),
  stockQuantity: z.coerce.number().int().min(0).default(25),
  imageUrl: z.string().trim().min(1, 'Image URL is required'),
  sectionTags: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const couponInputSchema = z.object({
  code: z.string().trim().min(3, 'Coupon code is required').toUpperCase(),
  description: z.string().trim().min(2, 'Description is required'),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.coerce.number().int().positive('Discount value must be positive'),
  minOrderCents: z.coerce.number().int().min(0).default(0),
  maxUses: z.coerce.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const orderStatusUpdateSchema = z.object({
  orderStatus: z.enum([
    'pending',
    'confirmed',
    'packed',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ]),
  paymentStatus: z.enum(['pending', 'paid', 'failed']).optional(),
});
