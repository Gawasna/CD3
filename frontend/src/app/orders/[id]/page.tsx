'use client';

import { use } from 'react';
import Link from 'next/link';
import { Image, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface OrderStatusPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderStatusPage({ params }: OrderStatusPageProps) {
  const { id } = use(params);
  const t = useTranslations('orderStatus');

  // Mock data
  const order = {
    id: '#AUC-2024-001234',
    status: 'delivered',
    product: {
      title: 'MacBook Pro M1 - Mint Condition',
      seller: '0x34..EF56',
      finalPrice: '1.2 ETH',
    },
    timeline: [
      { title: 'Auction Won', time: 'May 8, 2026 - 10:30 AM', completed: true },
      { title: 'Payment Confirmed', time: 'May 8, 2026 - 10:35 AM', completed: true },
      { title: 'Shipped', time: 'May 9, 2026 - 09:00 AM', completed: true },
      { title: 'Delivered', time: 'May 10, 2026 - 02:15 PM', completed: true },
    ],
    shipping: {
      trackingNumber: 'TRK123456789',
      carrier: 'FedEx Express',
      estimatedDelivery: 'May 10, 2026',
    },
    payment: {
      winningBid: '1.2 ETH',
      platformFee: '0.024 ETH',
      shipping: '0.05 ETH',
      total: '1.274 ETH',
    },
  };

  return (
    <div className="flex flex-col gap-8 p-12 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      <h1 className="font-jetbrains text-4xl font-extrabold text-[#111111]">
        Order Status
      </h1>

      <div className="flex gap-8">
        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Order Card */}
          <div className="bg-white rounded-2xl border border-[#CBCCC9] p-8 flex flex-col gap-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <span className="font-geist text-xs text-[#666666]">Order ID</span>
                <span className="font-jetbrains text-lg font-bold text-[#111111]">
                  {order.id}
                </span>
              </div>
              <span className="px-4 py-1.5 rounded-full bg-[#DFE6E1] text-[#004D1A] font-jetbrains text-sm font-bold">
                Delivered
              </span>
            </div>

            <div className="w-full h-px bg-[#CBCCC9]" />

            {/* Product */}
            <div className="flex gap-4 items-center">
              <div className="w-20 h-20 bg-[#E7E8E5] rounded-2xl flex items-center justify-center flex-shrink-0">
                <Image className="w-8 h-8 text-[#666666]" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-jetbrains text-lg font-semibold text-[#111111]">
                  {order.product.title}
                </h3>
                <p className="font-geist text-sm text-[#666666]">
                  Seller: {order.product.seller}
                </p>
                <p className="font-jetbrains text-base font-bold text-[#111111]">
                  Final Price: {order.product.finalPrice}
                </p>
              </div>
            </div>

            <div className="w-full h-px bg-[#CBCCC9]" />

            {/* Timeline */}
            <div className="flex flex-col gap-4">
              <h3 className="font-jetbrains text-base font-bold text-[#111111]">
                Order Timeline
              </h3>
              <div className="flex flex-col gap-3">
                {order.timeline.map((step, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-[#DFE6E1] flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-[#004D1A]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-jetbrains text-sm font-semibold text-[#111111]">
                        {step.title}
                      </span>
                      <span className="font-geist text-xs text-[#666666]">
                        {step.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-[400px] flex flex-col gap-6">
          {/* Shipping Info */}
          <div className="bg-white rounded-2xl border border-[#CBCCC9] p-6 flex flex-col gap-4">
            <h3 className="font-jetbrains text-lg font-bold text-[#111111]">
              Shipping Info
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="font-geist text-xs text-[#666666]">Tracking Number</span>
                <span className="font-jetbrains text-sm font-semibold text-[#111111]">
                  {order.shipping.trackingNumber}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-geist text-xs text-[#666666]">Carrier</span>
                <span className="font-jetbrains text-sm font-semibold text-[#111111]">
                  {order.shipping.carrier}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-geist text-xs text-[#666666]">Estimated Delivery</span>
                <span className="font-jetbrains text-sm font-semibold text-[#111111]">
                  {order.shipping.estimatedDelivery}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-2xl border border-[#CBCCC9] p-6 flex flex-col gap-4">
            <h3 className="font-jetbrains text-lg font-bold text-[#111111]">
              Payment Details
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-geist text-sm text-[#666666]">Winning Bid</span>
                <span className="font-jetbrains text-sm font-semibold text-[#111111]">
                  {order.payment.winningBid}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-geist text-sm text-[#666666]">Platform Fee (2%)</span>
                <span className="font-jetbrains text-sm font-semibold text-[#111111]">
                  {order.payment.platformFee}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-geist text-sm text-[#666666]">Shipping</span>
                <span className="font-jetbrains text-sm font-semibold text-[#111111]">
                  {order.payment.shipping}
                </span>
              </div>
              <div className="w-full h-px bg-[#CBCCC9]" />
              <div className="flex justify-between items-center">
                <span className="font-jetbrains text-base font-bold text-[#111111]">
                  Total Paid
                </span>
                <span className="font-jetbrains text-lg font-bold text-[#111111]">
                  {order.payment.total}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button className="w-full h-11 px-4 rounded-full bg-[#FF8400] text-[#111111] font-jetbrains text-sm font-semibold hover:opacity-90 transition-opacity">
              Contact Seller
            </button>
            <button className="w-full h-11 px-4 rounded-full bg-[#E7E8E5] border border-[#CBCCC9] text-[#111111] font-jetbrains text-sm font-semibold hover:bg-[#CBCCC9] transition-colors">
              Open Dispute
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
