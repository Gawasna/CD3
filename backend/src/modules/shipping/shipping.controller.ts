import { Request, Response, NextFunction } from 'express';
import { shippingService } from './shipping.service';

export const getShippingQuote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { auctionId, fromAddress, toAddress } = req.body;
    const result = await shippingService.getQuote(userId, auctionId, fromAddress, toAddress);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getShippingHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { auctionId } = req.params;
    const result = await shippingService.getShippingDetails(auctionId as string);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};
