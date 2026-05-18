'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { Image, Check, Package, Truck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuction } from '@/services/api/auction';
import { getShippingHistory, getShippingQuote } from '@/services/api/shipping';
import { useAuthStore } from '@/store/auth.store';
import { formatEther } from 'viem';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import AuctionPlatformABI from '@/services/blockchain/abi/AuctionPlatform.json';
import { useToast } from '@/components/auth/ToastContainer';
import TransactionDialog from '@/components/shared/TransactionDialog';

interface OrderStatusPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderStatusPage({ params }: OrderStatusPageProps) {
  const { id: auctionId } = use(params);
  const { user, token } = useAuthStore();
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Dialog & Transaction State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<'waiting_wallet' | 'confirming' | 'finalizing' | 'error' | 'success'>('waiting_wallet');
  const [txError, setTxError] = useState<string | null>(null);

  const { writeContract, data: txHash } = useWriteContract();
  const { isSuccess: isTxConfirmed, isLoading: isTxConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  // 1. Fetch Auction Data
  const { data: auctionData, isLoading: isLoadingAuction } = useQuery({
    queryKey: ['auction', auctionId],
    queryFn: () => getAuction(auctionId),
    enabled: !!auctionId,
  });

  // 2. Fetch Shipping History
  const { data: shippingHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['shipping-history', auctionId],
    queryFn: () => getShippingHistory(auctionId),
    enabled: !!auctionId,
  });

  const auction = auctionData?.auction;
  const history = shippingHistory?.data || [];
  const isSeller = user?.id === auction?.sellerId;
  const isWinner = user?.id === auction?.winnerId;

  // 3. Mutations
  const quoteMutation = useMutation({
    mutationFn: () => getShippingQuote(auctionId, user?.address1 || 'Seller Address', 'Winner Address'),
    onSuccess: () => {
      showToast('success', 'Shipping quote requested!');
      queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
      queryClient.invalidateQueries({ queryKey: ['shipping-history', auctionId] });
    },
    onError: (err: any) => showToast('error', err.message || 'Failed to request quote'),
  });

  // ── Smart Contract Interactions ──────────────────────────────────────────

  const handlePayShippingFee = () => {
    if (!auction?.onChainAuctionId || !auction.shippingCostWei) return;
    setIsDialogOpen(true);
    setDialogStatus('waiting_wallet');
    setTxError(null);

    writeContract({
      address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
      abi: AuctionPlatformABI.abi,
      functionName: 'payShippingFee',
      args: [BigInt(auction.onChainAuctionId)],
      value: BigInt(auction.shippingCostWei),
    }, {
      onSuccess: () => setDialogStatus('confirming'),
      onError: (err: any) => {
        setTxError(err.shortMessage || err.message);
        setDialogStatus('error');
      }
    });
  };

  const handleMarkShipped = () => {
    if (!auction?.onChainAuctionId) return;
    setIsDialogOpen(true);
    setDialogStatus('waiting_wallet');
    setTxError(null);

    const mockProof = '0x' + '0'.repeat(64); // Mock bytes32

    writeContract({
      address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
      abi: AuctionPlatformABI.abi,
      functionName: 'markShipped',
      args: [BigInt(auction.onChainAuctionId), mockProof as `0x${string}`],
    }, {
      onSuccess: () => setDialogStatus('confirming'),
      onError: (err: any) => {
        setTxError(err.shortMessage || err.message);
        setDialogStatus('error');
      }
    });
  };

  const handleConfirmDelivery = () => {
    if (!auction?.onChainAuctionId) return;
    setIsDialogOpen(true);
    setDialogStatus('waiting_wallet');
    setTxError(null);

    writeContract({
      address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
      abi: AuctionPlatformABI.abi,
      functionName: 'confirmDelivery',
      args: [BigInt(auction.onChainAuctionId)],
    }, {
      onSuccess: () => setDialogStatus('confirming'),
      onError: (err: any) => {
        setTxError(err.shortMessage || err.message);
        setDialogStatus('error');
      }
    });
  };

  useEffect(() => {
    if (isTxConfirmed) {
      setDialogStatus('finalizing');
      setTimeout(() => {
        setDialogStatus('success');
        queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
        queryClient.invalidateQueries({ queryKey: ['shipping-history', auctionId] });
      }, 2000);
    }
  }, [isTxConfirmed, queryClient, auctionId]);

  // ── UI Rendering ─────────────────────────────────────────────────────────

  if (isLoadingAuction) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F2F3F0]">
        <Loader2 className="w-8 h-8 text-[#FF8400] animate-spin" />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F2F3F0] gap-4">
        <AlertCircle className="w-12 h-12 text-[#FF8400]" />
        <h2 className="font-jetbrains text-xl font-bold">Order Not Found</h2>
        <Link href="/dashboard/my-products" className="text-[#FF8400] hover:underline">Back to My Products</Link>
      </div>
    );
  }

  const latestStatus = history[0]?.status || 'PENDING';
  const shippingFeePaid = history.some(log => log.notes?.includes('paid shipping fee'));
  const needsFeePayment = auction.shippingPayer === 'BUYER' && !shippingFeePaid && BigInt(auction.shippingCostWei || '0') > 0n;

  return (
    <div className="flex flex-col gap-8 p-12 min-h-[calc(100vh-72px)] bg-[#F2F3F0]">
      <TransactionDialog 
        isOpen={isDialogOpen}
        status={dialogStatus}
        error={txError || undefined}
        onClose={() => setIsDialogOpen(false)}
      />

      <h1 className="font-jetbrains text-4xl font-extrabold text-[#111111]">Order Status</h1>

      <div className="flex gap-8">
        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-[#CBCCC9] p-8 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <span className="font-geist text-xs text-[#666666]">Order ID</span>
                <span className="font-jetbrains text-lg font-bold text-[#111111]">#AUC-{auctionId.slice(0, 8).toUpperCase()}</span>
              </div>
              <span className={`px-4 py-1.5 rounded-full font-jetbrains text-sm font-bold ${
                auction.escrowStatus === 'COMPLETED' ? 'bg-[#DFE6E1] text-[#004D1A]' : 'bg-[#FFE5CC] text-[#FF8400]'
              }`}>
                {auction.escrowStatus}
              </span>
            </div>

            <div className="w-full h-px bg-[#CBCCC9]" />

            <div className="flex gap-4 items-center">
              <div className="w-20 h-20 bg-[#E7E8E5] rounded-2xl flex items-center justify-center flex-shrink-0">
                <Image className="w-8 h-8 text-[#666666]" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-jetbrains text-lg font-semibold text-[#111111]">{auction.title}</h3>
                <p className="font-geist text-sm text-[#666666]">Seller: {auction.seller.walletAddress}</p>
                <p className="font-jetbrains text-base font-bold text-[#111111]">
                  Winning Bid: {formatEther(BigInt(auction.bids?.[0]?.amountWei || '0'))} ETH
                </p>
              </div>
            </div>

            <div className="w-full h-px bg-[#CBCCC9]" />

            <div className="flex flex-col gap-4">
              <h3 className="font-jetbrains text-base font-bold text-[#111111]">Order Timeline</h3>
              <div className="flex flex-col gap-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E7E8E5]">
                {history.map((log, index) => (
                  <div key={log.id} className="flex gap-6 items-start relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                      index === 0 ? 'bg-[#FF8400] text-white' : 'bg-[#DFE6E1] text-[#004D1A]'
                    }`}>
                      {log.status === 'CONFIRMED' ? <CheckCircle2 className="w-4 h-4" /> : 
                       log.status === 'SHIPPED' ? <Truck className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-jetbrains text-sm font-semibold text-[#111111]">{log.status}</span>
                      <p className="font-geist text-sm text-[#666666]">{log.notes}</p>
                      <span className="font-geist text-xs text-[#999999]">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-[400px] flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-[#CBCCC9] p-6 flex flex-col gap-4">
            <h3 className="font-jetbrains text-lg font-bold text-[#111111]">Shipping Info</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-geist text-sm text-[#666666]">Payer</span>
                <span className="font-jetbrains text-sm font-semibold text-[#111111]">{auction.shippingPayer}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-geist text-sm text-[#666666]">Carrier</span>
                <span className="font-jetbrains text-sm font-semibold text-[#111111]">{history[0]?.carrierName || 'TBD'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-geist text-sm text-[#666666]">Tracking</span>
                <span className="font-jetbrains text-sm font-semibold text-[#111111]">{history[0]?.trackingCode || 'Not Shipped'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-geist text-sm text-[#666666]">Cost</span>
                <span className="font-jetbrains text-sm font-semibold text-[#111111]">
                  {BigInt(auction.shippingCostWei || '0') > 0n ? `${formatEther(BigInt(auction.shippingCostWei))} ETH` : 'Pending Quote'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#CBCCC9] p-6 flex flex-col gap-4">
            <h3 className="font-jetbrains text-lg font-bold text-[#111111]">Actions</h3>
            <div className="flex flex-col gap-3">
              {/* Seller Actions */}
              {isSeller && BigInt(auction.shippingCostWei || '0') === 0n && (
                <button 
                  onClick={() => quoteMutation.mutate()}
                  disabled={quoteMutation.isPending}
                  className="w-full h-11 px-4 rounded-full bg-[#FF8400] text-[#111111] font-jetbrains text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {quoteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Request Shipping Quote
                </button>
              )}

              {isSeller && auction.escrowStatus === 'AWAITING_SHIPMENT' && (
                <button 
                  onClick={handleMarkShipped}
                  className="w-full h-11 px-4 rounded-full bg-[#FF8400] text-[#111111] font-jetbrains text-sm font-semibold"
                >
                  Mark as Shipped
                </button>
              )}

              {/* Winner Actions */}
              {isWinner && needsFeePayment && (
                <button 
                  onClick={handlePayShippingFee}
                  className="w-full h-11 px-4 rounded-full bg-[#FF8400] text-[#111111] font-jetbrains text-sm font-semibold"
                >
                  Pay Shipping Fee ({formatEther(BigInt(auction.shippingCostWei))} ETH)
                </button>
              )}

              {isWinner && auction.escrowStatus === 'AWAITING_DELIVERY' && (
                <button 
                  onClick={handleConfirmDelivery}
                  className="w-full h-11 px-4 rounded-full bg-[#004D1A] text-white font-jetbrains text-sm font-semibold"
                >
                  Confirm Receipt & Release Funds
                </button>
              )}

              <button className="w-full h-11 px-4 rounded-full bg-[#E7E8E5] border border-[#CBCCC9] text-[#111111] font-jetbrains text-sm font-semibold">
                Contact {isSeller ? 'Buyer' : 'Seller'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
