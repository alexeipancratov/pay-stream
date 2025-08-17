import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { formatUnits, createPublicClient, http } from "viem";
import { sepolia } from "wagmi/chains";
import pyusdLogo from "../assets/paypal-usd-pyusd-logo.png";

const PAYMENT_ROUTER_ADDRESS = "0xBEdA19E852341961789eF4d684098f80f155dCc7"; // Sepolia address

interface PaymentReceivedEvent {
  invoiceId: string;
  merchant: string;
  payer: string;
  token: string;
  amount: bigint;
  timestamp: bigint;
  transactionHash: `0x${string}`;
}

export const PaymentRouterABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "invoiceId",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "merchant",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "payer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "PaymentReceived",
    type: "event",
  },
] as const;

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

const Dashboard: React.FC = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [payments, setPayments] = useState<PaymentReceivedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistoricalEvents = async () => {
      if (!isConnected || !connectedAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock > 10000n ? latestBlock - 9999n : 0n;

        const logs = await publicClient.getLogs({
          address: PAYMENT_ROUTER_ADDRESS,
          event: PaymentRouterABI[0],
          fromBlock: fromBlock,
          toBlock: "latest",
        });

        const historicalPayments = logs.map((log: any) => ({
          ...log.args,
          transactionHash: log.transactionHash,
        }));

        setPayments(historicalPayments);
      } catch (error) {
        console.error("Error fetching historical events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalEvents();
  }, [isConnected, connectedAddress]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-gray-400">
          Please connect your wallet to view the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Merchant Dashboard</h1>
      <p className="text-gray-400 mb-8">
        Connected Merchant Address:{" "}
        <span className="font-mono bg-gray-800 p-1 rounded">
          {connectedAddress}
        </span>
      </p>

      {loading ? (
        <p className="text-lg text-gray-400">Loading payments...</p>
      ) : payments.length === 0 ? (
        <p className="text-lg text-gray-400">
          No payments received yet for this merchant.
        </p>
      ) : (
        <div className="bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Timestamp
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Invoice ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Payer
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Amount (PYUSD)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Tx Link
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {payments.map((payment, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(
                      Number(payment.timestamp) * 1000
                    ).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {payment.invoiceId.slice(0, 6)}...
                    {payment.invoiceId.slice(-4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {payment.payer.slice(0, 6)}...{payment.payer.slice(-4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatUnits(payment.amount, 6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400 hover:text-blue-300">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${payment.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Tx
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex justify-center items-center mt-8">
        <span className="text-gray-500 mr-2">Powered by</span>
        <img src={pyusdLogo} alt="PYUSD Logo" className="h-8" />
      </div>
    </div>
  );
};

export default Dashboard;
