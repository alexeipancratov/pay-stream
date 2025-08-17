import React, { useState, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { formatUnits } from "viem";

const PAYMENT_ROUTER_ADDRESS = "0x58b35972F7C5c81cbd174cFf6839986F82D0f9f9"; // Sepolia address

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

const Dashboard: React.FC = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [payments, setPayments] = useState<PaymentReceivedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchHistoricalEvents = async () => {
      if (!publicClient || !isConnected || !connectedAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const logs = await publicClient.getLogs({
          address: PAYMENT_ROUTER_ADDRESS,
          event: PaymentRouterABI[0],
          args: {
            merchant: connectedAddress,
          },
          fromBlock: 0n,
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
  }, [publicClient, isConnected, connectedAddress]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-lg text-gray-700">
          Please connect your wallet to view the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Merchant Dashboard
      </h1>
      <p className="text-gray-600 mb-8">
        Connected Merchant Address:{" "}
        <span className="font-mono bg-gray-200 p-1 rounded">
          {connectedAddress}
        </span>
      </p>

      {payments.length === 0 ? (
        <p className="text-lg text-gray-700">
          No payments received yet for this merchant.
        </p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Timestamp
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Invoice ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Payer
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount (PYUSD)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tx Link
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(
                      Number(payment.timestamp) * 1000
                    ).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.invoiceId.slice(0, 6)}...
                    {payment.invoiceId.slice(-4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.payer.slice(0, 6)}...{payment.payer.slice(-4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatUnits(payment.amount, 6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${payment.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
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
    </div>
  );
};

export default Dashboard;
