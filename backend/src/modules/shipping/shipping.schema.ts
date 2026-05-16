import { z } from 'zod';

export const shippingQuoteSchema = z.object({
  auctionId: z.string().uuid(),
  fromAddress: z.string().min(5),
  toAddress: z.string().min(5),
});

export type ShippingQuoteBody = z.infer<typeof shippingQuoteSchema>;

export const updateShippingStatusSchema = z.object({
  auctionId: z.string().uuid(),
  status: z.enum(['PENDING', 'SHIPPED', 'CONFIRMED', 'CANCELED']),
  trackingCode: z.string().optional(),
  carrierName: z.string().optional(),
});

export type UpdateShippingStatusBody = z.infer<typeof updateShippingStatusSchema>;
