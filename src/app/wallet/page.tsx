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

const SPIN_COST = 50;

const SPIN_PRIZES = [
  { title: 'No Reward', prob: 45, type: 'none', icon: '😢' },
  { title: '+20 Bonus Points', prob: 20, type: 'points', value: 20, icon: '⭐' },
  { title: '+50 Bonus Points', prob: 15, type: 'points', value: 50, icon: '🌟' },
  { title: '₹50 Metro Recharge', prob: 8, type: 'reward', icon: '🚇' },
  { title: 'Eco Cafe Discount', prob: 5, type: 'reward', icon: '☕' },
  { title: 'Plant-a-Tree Certificate', prob: 5, type: 'reward', icon: '🌳' },
  { title: 'Green Champion Badge', prob: 2, type: 'reward', icon: '🏅' },
];

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [claimedRewards, setClaimedRewards] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // Spin State
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinRotation, setSpinRotation] = useState(0);
  const [spinHistory, setSpinHistory] = useState<any[]>([]);

  const fetchWalletData = () => {
    try {
      const currentBalance = parseInt(localStorage.getItem('greenmile_wallet_points') || '0', 10);
      const totalLifetime = parseInt(localStorage.getItem('greenmile_lifetime_points') || '0', 10);
      const claimedJson = localStorage.getItem('greenmile_rewards_claimed');
      const claimed = claimedJson ? JSON.parse(claimedJson) : [];
      
      const historyJson = localStorage.getItem('greenmile_luck_spin_history');
      const spinHist = historyJson ? JSON.parse(historyJson) : [];

      setBalance(currentBalance);
      setLifetimePoints(totalLifetime);
      setClaimedRewards(claimed);
      setSpinHistory(spinHist);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const showToast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleRedeem = (rewardId: number) => {
    const reward = REWARD_TIERS.find(r => r.id === rewardId);
    if (!reward) return;

    if (balance >= reward.points_required) {
      const newBalance = balance - reward.points_required;
      const newClaimed = [...claimedRewards, rewardId];
      
      localStorage.setItem('greenmile_wallet_points', newBalance.toString());
      localStorage.setItem('greenmile_rewards_claimed', JSON.stringify(newClaimed));
      
      showToast(`Success: You unlocked ${reward.title}!`);
      fetchWalletData();
    } else {
      showToast(`Error: You need ${reward.points_required - balance} more points to unlock this reward.`);
    }
  };

  const handleSpin = () => {
    if (balance < SPIN_COST || isSpinning) return;

    // Deduct 50 points immediately
    const newBalance = balance - SPIN_COST;
    setBalance(newBalance);
    localStorage.setItem('greenmile_wallet_points', newBalance.toString());
    
    const pointsSpent = parseInt(localStorage.getItem('greenmile_points_spent') || '0', 10);
    localStorage.setItem('greenmile_points_spent', (pointsSpent + SPIN_COST).toString());

    setIsSpinning(true);
    setMessage('');

    // Determine Result
    const rand = Math.random() * 100;
    let cumulativeProb = 0;
    let selectedPrize = SPIN_PRIZES[0];
    let prizeIndex = 0;

    for (let i = 0; i < SPIN_PRIZES.length; i++) {
      cumulativeProb += SPIN_PRIZES[i].prob;
      if (rand <= cumulativeProb) {
        selectedPrize = SPIN_PRIZES[i];
        prizeIndex = i;
        break;
      }
    }

    // Animate Wheel
    // 5 full rotations (1800deg) + the offset for the selected prize slice
    const sliceAngle = 360 / SPIN_PRIZES.length;
    // We want the selected slice to land at the top (0 or 360 deg)
    // The prize's center is at: prizeIndex * sliceAngle + (sliceAngle / 2)
    // To put it at the top (which we'll define as 0deg or top of the wheel), we rotate backwards by its center
    const targetOffset = 360 - (prizeIndex * sliceAngle + (sliceAngle / 2));
    const newRotation = spinRotation + 1800 + targetOffset - (spinRotation % 360);

    setSpinRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      
      // Process Result
      if (selectedPrize.type === 'points' && selectedPrize.value) {
        const afterWinBalance = newBalance + selectedPrize.value;
        localStorage.setItem('greenmile_wallet_points', afterWinBalance.toString());
        showToast(`Congratulations! You won ${selectedPrize.title}.`);
      } else if (selectedPrize.type === 'reward') {
        const currentWonJson = localStorage.getItem('greenmile_rewards_won');
        const currentWon = currentWonJson ? JSON.parse(currentWonJson) : [];
        currentWon.push(selectedPrize.title);
        localStorage.setItem('greenmile_rewards_won', JSON.stringify(currentWon));
        showToast(`Congratulations! You won ${selectedPrize.title}.`);
      } else {
        showToast('Better luck next time!');
      }

      // Add to history
      const historyItem = {
        title: selectedPrize.title,
        icon: selectedPrize.icon,
        timestamp: new Date().toISOString()
      };
      const newHistory = [historyItem, ...spinHistory].slice(0, 10); // Keep last 10
      localStorage.setItem('greenmile_luck_spin_history', JSON.stringify(newHistory));
      
      fetchWalletData();
    }, 3000); // 3 second animation
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

  const nextReward = REWARD_TIERS.find(r => !claimedRewards.includes(r.id) && balance < r.points_required);
  const progressPercentage = nextReward ? Math.min((balance / nextReward.points_required) * 100, 100) : 100;

  return (
    <div className="page-transition max-w-6xl mx-auto py-8 px-4">
      {message && (
        <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 text-white transition-all ${message.includes('Better luck') || message.includes('Error') ? 'bg-red-500' : 'bg-green-600'}`}>
          {message}
        </div>
      )}
      
      <div className="text-center mb-10">
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

      {/* Luck Spin Section */}
      <div className="max-w-4xl mx-auto bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-10 mb-12 flex flex-col md:flex-row gap-10 items-center justify-between">
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center md:justify-start gap-2">
            🎰 Green Luck Spin
          </h2>
          <p className="text-gray-600 mb-6">Try your luck! Spin the wheel to win instant bonus points or exclusive eco-rewards.</p>
          <div className="inline-block bg-yellow-50 text-yellow-800 font-bold px-4 py-2 rounded-xl mb-6">
            Cost: {SPIN_COST} Points
          </div>
          <br/>
          <button
            onClick={handleSpin}
            disabled={balance < SPIN_COST || isSpinning}
            className={`w-full md:w-auto font-bold py-4 px-10 rounded-2xl shadow-lg transition-all ${
              balance < SPIN_COST 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                : isSpinning
                  ? 'bg-green-400 text-white cursor-wait'
                  : 'bg-green-600 hover:bg-green-500 text-white hover:scale-105 hover:shadow-green-500/30'
            }`}
          >
            {isSpinning ? 'Spinning...' : 'SPIN NOW'}
          </button>
        </div>

        {/* Spin Wheel Visual */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex-shrink-0">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 z-10 text-red-500 text-3xl">▼</div>
          <div 
            className="w-full h-full rounded-full border-4 border-green-600 shadow-xl overflow-hidden relative transition-transform"
            style={{ 
              transform: `rotate(${spinRotation}deg)`, 
              transitionDuration: isSpinning ? '3s' : '0s',
              transitionTimingFunction: 'cubic-bezier(0.17, 0.67, 0.12, 0.99)'
            }}
          >
            {SPIN_PRIZES.map((prize, idx) => {
              const sliceAngle = 360 / SPIN_PRIZES.length;
              const rotation = idx * sliceAngle;
              return (
                <div 
                  key={idx}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    clipPath: `polygon(50% 50%, 50% 0, ${50 + 50 * Math.tan((sliceAngle / 2) * Math.PI / 180)}% 0)`
                  }}
                >
                  {/* Wheel Slice Background */}
                  <div 
                    className="absolute w-full h-full"
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#16a34a' : '#22c55e',
                      clipPath: `polygon(50% 50%, 100% 0, 100% 50%)`, // Base slice before rotation mask
                      transform: `rotate(-${90 - sliceAngle/2}deg)`,
                      transformOrigin: '50% 50%'
                    }}
                  ></div>
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pt-8 text-white font-bold" style={{ transform: 'rotate(0deg)'}}>
                     <span className="text-2xl drop-shadow-md">{prize.icon}</span>
                  </div>
                </div>
              )
            })}
            
            {/* Cleaner SVG Wheel approach for slices */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
              {SPIN_PRIZES.map((prize, idx) => {
                const angle = 360 / SPIN_PRIZES.length;
                const rotateAngle = idx * angle;
                return (
                  <g key={idx} transform={`rotate(${rotateAngle} 50 50)`}>
                    <path
                      d="M 50 50 L 50 0 A 50 50 0 0 1 89.09 19.13 Z" // Approx 51.4 deg slice
                      fill={idx % 2 === 0 ? '#16a34a' : '#22c55e'}
                      stroke="#14532d"
                      strokeWidth="0.5"
                    />
                    <text
                      x="70"
                      y="25"
                      transform="rotate(25 50 50)" // center text in slice
                      fontSize="5"
                      fill="white"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {prize.icon}
                    </text>
                  </g>
                );
              })}
              <circle cx="50" cy="50" r="15" fill="white" stroke="#16a34a" strokeWidth="2" />
              <text x="50" y="52" fontSize="6" fontWeight="bold" fill="#16a34a" textAnchor="middle">SPIN</text>
            </svg>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mb-16">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Spin History</h3>
        {spinHistory.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {spinHistory.map((item, idx) => (
                <li key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-semibold text-gray-800">{item.title}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl border p-8 text-center text-gray-500">
            No spins yet. Try your luck above!
          </div>
        )}
      </div>

      <div className="mb-6 flex justify-between items-end">
        <h2 className="text-2xl font-bold text-gray-900">Milestone Rewards Catalog</h2>
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
