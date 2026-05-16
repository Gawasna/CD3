import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { getShippingQuote, getShippingHistory } from './shipping.controller';
import { shippingQuoteSchema } from './shipping.schema';

const router = Router();

/**
 * @route POST /api/v1/shipping/quote
 * @desc Seller yêu cầu báo giá vận chuyển từ mock provider
 */
router.post('/quote', authenticate, validate(shippingQuoteSchema), getShippingQuote);

/**
 * @route GET /api/v1/shipping/:auctionId/history
 * @desc Lấy lịch sử vận chuyển của auction
 */
router.get('/:auctionId/history', authenticate, getShippingHistory);

export default router;
