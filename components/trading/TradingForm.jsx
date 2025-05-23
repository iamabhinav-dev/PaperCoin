"use client";

import { useState, useEffect, useCallback } from "react";
import { useOrderbook } from "@/Context/OrderBookContext";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "react-hot-toast"; // Import the toast function

export default function TradingForm() {
  const { orderbook, addVirtualOrder, rawOrderbook, connected } = useOrderbook();
  const [balance, setBalance] = useState({ USDT: 0, BTC: 0 });
  const { user } = useAuthStore();
  
  useEffect(() => {
    const fetchFunds = async () => {
      if (!user || !user.userId) {
        console.log("User not available yet, skipping funds fetch");
        return;
      }
      
      try {
        const response = await axios.post("/api/getFunds", { user_id: user.userId });
        if (response.status === 200) {
          console.log("Funds fetched successfully in trading: ", response.data.funds);
          
          const fundsData = response.data.funds;
          
          if (Array.isArray(fundsData) && fundsData.length > 0) {
            const userFunds = fundsData[0];
            setBalance({
              USDT: parseFloat(userFunds.available_funds) || 0,
              BTC: parseFloat(userFunds.btccoins) || 0
            });
          } else if (typeof fundsData === 'object' && fundsData !== null) {
            setBalance({
              USDT: parseFloat(fundsData.available_funds) || 0,
              BTC: parseFloat(fundsData.btccoins) || 0
            });
          }
        }
      } catch (error) {
        console.error("Error fetching funds:", error);
      }
    };
    
    fetchFunds();
  }, [user]);

  useEffect(() => {
    console.log("Balance updated:", balance);
  }, [balance]);

  const [orderType, setOrderType] = useState("Limit");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [buyAmount, setBuyAmount] = useState("1");
  const [sellAmount, setSellAmount] = useState("1");
  const [buyError, setBuyError] = useState("");
  const [sellError, setSellError] = useState("");
  const [marketPrice, setMarketPrice] = useState(null);

  const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
  };

  const parseInput = (value) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const validateNumberInput = (value) => {
    return /^[0-9]*\.?[0-9]*$/.test(value);
  };

  const buyTotal = buyPrice && buyAmount ? parseInput(buyPrice) * parseInput(buyAmount) : 0;
  const sellTotal = sellPrice && sellAmount ? parseInput(sellPrice) * parseInput(sellAmount) : 0;

  useEffect(() => {
    if (rawOrderbook && rawOrderbook.bids.length > 0 && rawOrderbook.asks.length > 0) {
      const bestBid = parseFloat(rawOrderbook.bids[0].price);
      const bestAsk = parseFloat(rawOrderbook.asks[0].price);

      const avgPrice = (bestBid + bestAsk) / 2;
      setMarketPrice(avgPrice);

      if (!buyPrice) setBuyPrice(formatPrice(avgPrice));
      if (!sellPrice) setSellPrice(formatPrice(avgPrice));
    }
  }, [rawOrderbook, buyPrice, sellPrice]);

  // Place buy order
  const handleBuy = async () => {
    setBuyError("");

    try {
      if (orderType !== "Market" && parseInput(buyPrice) <= 0) {
        throw new Error("Please enter a valid price");
      }

      if (parseInput(buyAmount) <= 0) {
        throw new Error("Please enter a valid amount");
      }

      const finalPrice = orderType === "Market" ? marketPrice : parseInput(buyPrice);
      const cost = finalPrice * parseInput(buyAmount);

      if (cost > balance.USDT) {
        throw new Error(
          `Insufficient USDT balance (${balance.USDT.toFixed(2)} USDT available)`
        );
      }

      addVirtualOrder("bids", finalPrice, parseInput(buyAmount));
      console.log("Buy order placed:", { price: finalPrice, amount: parseInput(buyAmount) });
      
      // Display success toast notification
      toast.success(
        `Buy order placed: ${parseInput(buyAmount)} BTC at ${formatPrice(finalPrice)} USDT`,
        {
          duration: 4000,
          position: "top-right",
          style: {
            background: '#10B981',
            color: '#fff',
            border: '1px solid #065F46',
          },
          icon: '🔄',
        }
      );
      
      setBuyAmount("1");
    } catch (error) {
      setBuyError(error.message);
      
      // Display error toast notification
      toast.error(error.message, {
        duration: 4000,
        position: "top-right",
        style: {
          background: '#EF4444',
          color: '#fff',
          border: '1px solid #991B1B',
        },
      });
    }
  };

  // Place sell order
  const handleSell = async () => {
    setSellError("");

    try {
      if (orderType !== "Market" && parseInput(sellPrice) <= 0) {
        throw new Error("Please enter a valid price");
      }

      if (parseInput(sellAmount) <= 0) {
        throw new Error("Please enter a valid amount");
      }

      if (parseInput(sellAmount) > balance.BTC) {
        throw new Error(
          `Insufficient BTC balance (${balance.BTC.toFixed(8)} BTC available)`
        );
      }

      const finalPrice = orderType === "Market" ? marketPrice : parseInput(sellPrice);

      addVirtualOrder("asks", finalPrice, parseInput(sellAmount));
      console.log("Sell order placed:", { price: finalPrice, amount: parseInput(sellAmount) });
      
      // Display success toast notification
      toast.success(
        `Sell order placed: ${parseInput(sellAmount)} BTC at ${formatPrice(finalPrice)} USDT`,
        {
          duration: 4000,
          position: "top-right",
          style: {
            background: '#EF4444',
            color: '#fff',
            border: '1px solid #991B1B',
          },
          icon: '🔄',
        }
      );

      setSellAmount("1");
    } catch (error) {
      setSellError(error.message);
      
      // Display error toast notification
      toast.error(error.message, {
        duration: 4000,
        position: "top-right",
        style: {
          background: '#EF4444',
          color: '#fff',
          border: '1px solid #991B1B',
        },
      });
    }
  };

  return (
    <div className="bg-[#111722] text-white p-4 rounded-xl w-full mx-auto shadow-xl border border-gray-800">
      {/* Order Type Buttons */}
      <div className="flex space-x-3 mb-4 items-center justify-between">
        <div>
          {["Limit", "Market"].map((type) => (
            <button
              key={type}
              className={`px-3 py-1.5 rounded-lg text-sm ${orderType === type
                ? "text-yellow-400 font-bold"
                : "text-white hover:bg-gray-800 transition-colors duration-200"
                }`}
              onClick={() => setOrderType(type)}
            >
              {type}
            </button>
          ))}
        </div>
        {/* Connection Status */}
        <div className="mb-3 w-64 flex items-center justify-end">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}
          ></div>
          <span className="text-xs text-gray-400">
            {connected ? 'Connected to Orderbook' : 'Disconnected from Orderbook'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BUY SIDE */}
        <div className="bg-[#111722] p-3 rounded-lg border border-gray-800 shadow-lg">
          {/* Price Input */}
          <div className="mb-3">
            <div className="bg-gray-800 border border-gray-700 rounded-lg relative">
              <div className="absolute top-1 left-2 text-gray-400 text-xs">
                Price per BTC
              </div>
              <input
                type="text"
                value={orderType === "Market" ? "Market Price" : buyPrice}
                onChange={(e) => {
                  if (validateNumberInput(e.target.value)) {
                    setBuyPrice(e.target.value);
                  }
                }}
                disabled={orderType === "Market"}
                className={`w-full bg-transparent pt-6 pb-1.5 px-2 focus:outline-none text-right text-sm ${orderType === "Market" ? "text-gray-500" : "text-white"
                  }`}
              />
              <div className="absolute top-1 right-2 text-gray-400 text-xs">
                USDT
              </div>
            </div>
          </div>

          {/* Amount Input (BTC to buy) */}
          <div className="mb-3">
            <div className="bg-gray-800 border border-gray-700 rounded-lg relative">
              <div className="absolute top-1 left-2 text-gray-400 text-xs">
                BTC to Buy
              </div>
              <input
                type="text"
                value={buyAmount}
                onChange={(e) => {
                  if (validateNumberInput(e.target.value)) {
                    setBuyAmount(e.target.value);
                  }
                }}
                className="w-full bg-transparent pt-6 pb-1.5 px-2 focus:outline-none text-right text-sm text-white"
              />
              <div className="absolute top-1 right-2 text-gray-400 text-xs">
                BTC
              </div>
            </div>
          </div>

          {/* Total Cost */}
          <div className="mb-3 bg-gray-800 border border-gray-700 rounded-lg p-2 flex justify-between items-center">
            <span className="text-gray-400 text-xs">Total Cost:</span>
            <span className="text-white text-sm">
              {orderType === "Market" && marketPrice
                ? (parseInput(buyAmount) * marketPrice).toFixed(2)
                : buyTotal.toFixed(2)} USDT
            </span>
          </div>

          {/* Available Balance */}
          <div className="flex justify-between text-gray-400 mb-3 text-xs">
            <span>Available</span>
            <span>{balance.USDT.toFixed(2)} USDT</span>
          </div>

          {/* Market Price */}
          {marketPrice && (
            <div className="flex justify-between text-gray-400 mb-3 text-xs">
              <span>Current Market Price</span>
              <span>{formatPrice(marketPrice)} USDT</span>
            </div>
          )}

          {buyError && <div className="mb-3 text-red-500 text-xs">{buyError}</div>}

          <button
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium shadow-lg text-sm transition-colors duration-200"
            onClick={handleBuy}
            disabled={!connected}
          >
            Buy BTC
          </button>
        </div>

        {/* SELL SIDE */}
        <div className="bg-[#111722] p-3 rounded-lg border border-gray-800 shadow-lg">
          {/* Price Input */}
          <div className="mb-3">
            <div className="bg-gray-800 border border-gray-700 rounded-lg relative">
              <div className="absolute top-1 left-2 text-gray-400 text-xs">
                Price per BTC
              </div>
              <input
                type="text"
                value={orderType === "Market" ? "Market Price" : sellPrice}
                onChange={(e) => {
                  if (validateNumberInput(e.target.value)) {
                    setSellPrice(e.target.value);
                  }
                }}
                disabled={orderType === "Market"}
                className={`w-full bg-transparent pt-6 pb-1.5 px-2 focus:outline-none text-right text-sm ${orderType === "Market" ? "text-gray-500" : "text-white"
                  }`}
              />
              <div className="absolute top-1 right-2 text-gray-400 text-xs">
                USDT
              </div>
            </div>
          </div>

          {/* Amount Input (BTC to sell) */}
          <div className="mb-3">
            <div className="bg-gray-800 border border-gray-700 rounded-lg relative">
              <div className="absolute top-1 left-2 text-gray-400 text-xs">
                BTC to Sell
              </div>
              <input
                type="text"
                value={sellAmount}
                onChange={(e) => {
                  if (validateNumberInput(e.target.value)) {
                    setSellAmount(e.target.value);
                  }
                }}
                className="w-full bg-transparent pt-6 pb-1.5 px-2 focus:outline-none text-right text-sm text-white"
              />
              <div className="absolute top-1 right-2 text-gray-400 text-xs">
                BTC
              </div>
            </div>
          </div>

          {/* Total Receive */}
          <div className="mb-3 bg-gray-800 border border-gray-700 rounded-lg p-2 flex justify-between items-center">
            <span className="text-gray-400 text-xs">Total Receive:</span>
            <span className="text-white text-sm">
              {orderType === "Market" && marketPrice
                ? (parseInput(sellAmount) * marketPrice).toFixed(2)
                : sellTotal.toFixed(2)} USDT
            </span>
          </div>

          {/* Available Balance */}
          <div className="flex justify-between text-gray-400 mb-3 text-xs">
            <span>Available</span>
            <span>{balance.BTC.toFixed(8)} BTC</span>
          </div>

          {/* Market Price */}
          {marketPrice && (
            <div className="flex justify-between text-gray-400 mb-3 text-xs">
              <span>Current Market Price</span>
              <span>{formatPrice(marketPrice)} USDT</span>
            </div>
          )}

          {sellError && <div className="mb-3 text-red-500 text-xs">{sellError}</div>}

          <button
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium shadow-lg text-sm transition-colors duration-200"
            onClick={handleSell}
            disabled={!connected}
          >
            Sell BTC
          </button>
        </div>
      </div>
    </div>
  );
}