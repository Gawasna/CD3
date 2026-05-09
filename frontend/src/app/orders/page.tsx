'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, Image as ImageIcon } from 'lucide-react';

type OrderStatus = 'all' | 'pending' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  productName: string;
  productDescription: string;
  price: string;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  image?: string;
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus>('all');

  // Mock data
  const orders: Order[] = [
    {
      id: '1',
      orderNumber: '#12345',
      date: 'May 8, 2026',
      productName: 'Vintage Camera',
      productDescription: 'Classic film camera in excellent condition',
      price: '$450.00',
      status: 'delivered',
    },
    {
      id: '2',
      orderNumber: '#12344',
      date: 'May 7, 2026',
      productName: 'Leather Jacket',
      productDescription: 'Premium leather jacket, size M',
      price: '$280.00',
      status: 'shipped',
    },
    {
      id: '3',
      orderNumber: '#12343',
      date: 'May 6, 2026',
      productName: 'Vintage Watch',
      productDescription: 'Swiss mechanical watch, 1960s',
      price: '$1,200.00',
      status: 'pending',
    },
    {
      id: '4',
      orderNumber: '#12342',
      date: 'May 5, 2026',
      productName: 'Designer Sunglasses',
      productDescription: 'Ray-Ban aviator sunglasses',
      price: '$150.00',
      status: 'delivered',
    },
    {
      id: '5',
      orderNumber: '#12341',
      date: 'May 4, 2026',
      productName: 'Mechanical Keyboard',
      productDescription: 'Cherry MX Blue switches',
      price: '$180.00',
      status: 'cancelled',
    },
  ];

  const getStatusBadge = (status: Order['status']) => {
    const styles = {
      delivered: 'bg-[#DFE6E1] text-[#004D1A]',
      shipped: 'bg-[#E9E3D8] text-[#804200]',
      pending: 'bg-[#E7E8E5] text-[#111111]',
      cancelled: 'bg-[#E7E8E5] text-[#666666]',
    };

    const labels = {
      delivered: 'Delivered',
      shipped: 'Shipped',
      pending: 'Pending',
      cancelled: 'Cancelled',
    };

    return (
      <span className={`px-4 py-1.5 rounded-full font-jetbrains text-xs font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeTab);

  return (
    <div className="flex min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      {/* Sidebar */}
      <div className="w-[280px] bg-white border-r border-[#CBCCC9] p-8 flex flex-col gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl font-jetbrains text-sm font-semibold text-[#666666] hover:bg-[#E7E8E5] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          My Bids
        </Link>
        <Link
          href="/my-products"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl font-jetbrains text-sm font-semibold text-[#666666] hover:bg-[#E7E8E5] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          My Auctions
        </Link>
        <Link
          href="/orders"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl font-jetbrains text-sm font-semibold bg-[#FF8400] text-[#111111] transition-colors"
        >
          <Package className="w-5 h-5" />
          Orders
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-12 flex flex-col gap-8">
        <h1 className="font-jetbrains text-4xl font-extrabold text-[#111111]">
          Orders
        </h1>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 rounded-2xl font-jetbrains text-sm font-semibold transition-colors ${
              activeTab === 'all'
                ? 'bg-[#FF8400] text-[#111111]'
                : 'bg-transparent text-[#666666] hover:bg-[#E7E8E5]'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 rounded-2xl font-jetbrains text-sm font-semibold transition-colors ${
              activeTab === 'pending'
                ? 'bg-[#FF8400] text-[#111111]'
                : 'bg-transparent text-[#666666] hover:bg-[#E7E8E5]'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab('shipped')}
            className={`px-6 py-3 rounded-2xl font-jetbrains text-sm font-semibold transition-colors ${
              activeTab === 'shipped'
                ? 'bg-[#FF8400] text-[#111111]'
                : 'bg-transparent text-[#666666] hover:bg-[#E7E8E5]'
            }`}
          >
            Shipped
          </button>
          <button
            onClick={() => setActiveTab('delivered')}
            className={`px-6 py-3 rounded-2xl font-jetbrains text-sm font-semibold transition-colors ${
              activeTab === 'delivered'
                ? 'bg-[#FF8400] text-[#111111]'
                : 'bg-transparent text-[#666666] hover:bg-[#E7E8E5]'
            }`}
          >
            Delivered
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-6 py-3 rounded-2xl font-jetbrains text-sm font-semibold transition-colors ${
              activeTab === 'cancelled'
                ? 'bg-[#FF8400] text-[#111111]'
                : 'bg-transparent text-[#666666] hover:bg-[#E7E8E5]'
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Orders List */}
        <div className="flex flex-col gap-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#CBCCC9] p-12 flex flex-col items-center justify-center gap-4">
              <Package className="w-16 h-16 text-[#CBCCC9]" />
              <p className="font-geist text-lg text-[#666666]">
                No orders found
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-[#CBCCC9] p-6 flex flex-col gap-5"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-2">
                    <h3 className="font-jetbrains text-base font-bold text-[#111111]">
                      Order {order.orderNumber}
                    </h3>
                    <span className="font-geist text-sm text-[#666666]">
                      {order.date}
                    </span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Order Body */}
                <div className="flex items-center gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-[#E7E8E5] rounded-2xl flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-8 h-8 text-[#666666]" />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 flex flex-col gap-2">
                    <h4 className="font-jetbrains text-base font-semibold text-[#111111]">
                      {order.productName}
                    </h4>
                    <p className="font-geist text-sm text-[#666666]">
                      {order.productDescription}
                    </p>
                  </div>

                  {/* Price */}
                  <span className="font-jetbrains text-lg font-bold text-[#FF8400]">
                    {order.price}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
