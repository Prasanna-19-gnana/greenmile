'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const REWARD_TIERS = [
  { id: 1, title: '₹50 Metro Recharge', points_required: 1000, description: 'Get a ₹50 top-up on your Metro Card.' },
  { id: 2, title: 'Eco Cafe Discount Voucher', points_required: 2000, description: '20% off at partnered Eco Cafes.' },
  { id: 3, title: 'Plant-a-Tree Certificate', points_required: 3000, description: 'A tree planted in your name with a certificate.' },
  { id: 4, title: 'Green Champion Badge', points_required: 5000, description: 'Exclusive profile badge and leaderboard icon.' },
  { id: 5, title: 'Premium Sustainable Commuter Badge', points_required: 10000, description: 'Highest honor for green commuters.' }
];

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [claimedRewards, setClaimedRewards] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchWalletData = () => {
    try {
      const currentBalance = parseInt(localStorage.getItem('greenmile_wallet_points') || '0', 10);
      const totalLifetime = parseInt(localStorage.getItem('greenmile_lifetime_points') || '0', 10);
      const claimedJson = localStorage.getItem('greenmile_rewards_claimed');
      const claimed = claimedJson ? JSON.parse(claimedJson) : [];
      
      setBalance(currentBalance);
      setLifetimePoints(totalLifetime);
      setClaimedRewards(claimed);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleRedeem = (rewardId: number) => {
    const reward = REWARD_TIERS.find(r => r.id === rewardId);
    if (!reward) return;

    if (balance >= reward.points_required) {
      const newBalance = balance - reward.points_required;
      const newClaimed = [...claimedRewards, rewardId];
      
      localStorage.setItem('greenmile_wallet_points', newBalance.toString());
      localStorage.setItem('greenmile_rewards_claimed', JSON.stringify(newClaimed));
      
      setMessage(`Success: You unlocked ${reward.title}!`);
      fetchWalletData();
    } else {
      setMessage(`Error: You need ${reward.points_required - balance} more points to unlock this reward.`);
    }
    
    setTimeout(() => setMessage(''), 3000);
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

  // Calculate Progress
  const nextReward = REWARD_TIERS.find(r => !claimedRewards.includes(r.id) && balance < r.points_required);
  const progressPercentage = nextReward ? Math.min((balance / nextReward.points_required) * 100, 100) : 100;

  return (
    <div className="page-transition max-w-6xl mx-auto py-8 px-4">
      {message && (
        <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 text-white ${message.startsWith('Success') ? 'bg-green-600' : 'bg-red-500'}`}>
          {message}
        </div>
      )}
      
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Green Wallet</h1>
        
        <div className="flex flex-col sm:flex-row justify-center gap-6 mt-6">
          <div className="bg-green-50 border border-green-200 rounded-3xl px-8 py-4">
            <div className="text-green-800 text-sm font-medium mb-1">Available Points</div>
            <div className="text-4xl font-bold text-green-600 animate-count-up">{balance} ⭐</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-3xl px-8 py-4">
            <div className="text-blue-800 text-sm font-medium mb-1">Lifetime Points Earned</div>
            <div className="text-4xl font-bold text-blue-600 animate-count-up">{lifetimePoints} ⭐</div>
          </div>
        </div>

        {nextReward && (
          <div className="max-w-xl mx-auto mt-8 bg-white border rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-600">Next Reward: {nextReward.title}</span>
              <span className="font-bold text-green-600">{balance} / {nextReward.points_required} pts</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-right">
              {nextReward.points_required - balance} points to go!
            </div>
          </div>
        )}
      </div>

      <div className="mb-6 flex justify-between items-end">
        <h2 className="text-2xl font-bold text-gray-900">Reward Catalog</h2>
        <div className="text-sm text-gray-500">
          Unlocked: {claimedRewards.length} / {REWARD_TIERS.length}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {REWARD_TIERS.map((reward) => {
          const canAfford = balance >= reward.points_required;
          const isRedeemed = claimedRewards.includes(reward.id);

          return (
            <div key={reward.id} className={`bg-white rounded-2xl shadow-md transition-all p-6 flex flex-col border-2 ${isRedeemed ? 'border-green-200' : canAfford ? 'border-green-500 shadow-green-100 hover:shadow-lg' : 'border-transparent hover:shadow-lg'} relative overflow-hidden`}>
              {isRedeemed && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  CLAIMED
                </div>
              )}
              
              <div className="text-4xl mb-4">{getIcon(reward.title)}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{reward.title}</h3>
              <p className="text-gray-600 text-sm mb-4 flex-grow">{reward.description}</p>
              <div className="font-bold text-green-600 mb-4">{reward.points_required} Points</div>
              
              {isRedeemed ? (
                <button disabled className="bg-green-50 text-green-700 font-semibold py-3 px-4 rounded-xl text-center border border-green-200 w-full">
                  Claimed
                </button>
              ) : canAfford ? (
                <button
                  onClick={() => handleRedeem(reward.id)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all w-full shadow-md shadow-green-600/20 hover:shadow-lg hover:-translate-y-0.5"
                >
                  Redeem Reward
                </button>
              ) : (
                <button 
                  onClick={() => handleRedeem(reward.id)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-500 font-semibold py-3 px-4 rounded-xl transition-all w-full border border-gray-200"
                >
                  Need {reward.points_required - balance} pts
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
