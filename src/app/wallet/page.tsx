'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchWalletData = async () => {
    try {
      const [dashRes, rewRes] = await Promise.all([
        fetch('/api/dashboard/1'),
        fetch('/api/rewards?userId=1')
      ]);
      const dashData = await dashRes.json();
      const rewData = await rewRes.json();
      
      setBalance(dashData?.userInfo?.total_points || 0);
      setRewards(rewData?.rewards || []);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleRedeem = async (rewardId: number) => {
    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, rewardId })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Success: ${data.message}`);
        fetchWalletData();
      } else {
        setMessage(`Error: ${data.message}`);
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const getIcon = (title: string) => {
    if (title.toLowerCase().includes('metro')) return '🚇';
    if (title.toLowerCase().includes('cafe')) return '☕';
    if (title.toLowerCase().includes('tree')) return '🌳';
    return '🏅';
  };

  return (
    <div className="page-transition max-w-6xl mx-auto py-8 px-4">
      {message && (
        <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 text-white ${message.startsWith('Success') ? 'bg-green-600' : 'bg-red-500'}`}>
          {message}
        </div>
      )}
      
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Green Wallet</h1>
        <div className="inline-block bg-green-50 border border-green-200 rounded-3xl px-8 py-4 mt-4">
          <div className="text-green-800 text-sm font-medium mb-1">Available Points</div>
          <div className="text-4xl font-bold text-green-600 animate-count-up">{balance} ⭐</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {rewards.map((reward: any) => {
          const canAfford = balance >= reward.points_required;
          const isRedeemed = reward.redeemed;

          return (
            <div key={reward.id} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-6 flex flex-col">
              <div className="text-4xl mb-4">{getIcon(reward.title)}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{reward.title}</h3>
              <p className="text-gray-600 mb-4 flex-grow">{reward.description}</p>
              <div className="font-bold text-green-600 mb-4">{reward.points_required} Points</div>
              
              {isRedeemed ? (
                <div className="bg-gray-100 text-gray-500 font-semibold py-3 px-4 rounded-xl text-center">
                  ✅ Redeemed
                </div>
              ) : canAfford ? (
                <button
                  onClick={() => handleRedeem(reward.id)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all"
                >
                  Redeem Reward
                </button>
              ) : (
                <button disabled className="bg-gray-200 text-gray-500 font-semibold py-3 px-4 rounded-xl cursor-not-allowed">
                  Need {reward.points_required - balance} more pts
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
