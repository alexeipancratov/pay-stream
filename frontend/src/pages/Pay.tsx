import React, { useState, useEffect } from "react";
import {
  useAccount,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { isAddress } from "viem";
import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { sepolia } from "wagmi/chains";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";

// ABI for PYUSD (simplified for approve)
const pyusdAbi = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ABI for PaymentRouter (simplified for pay)
const paymentRouterAbi = [
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "address", name: "merchant", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "bytes32", name: "invoiceId", type: "bytes32" },
      { internalType: "uint256", name: "expiresAt", type: "uint256" },
    ],
    name: "pay",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

interface Invoice {
  version: string;
  chainId: number;
  token: string;
  merchant: string;
  amount: string;
  amountWei: string;
  invoiceId: string;
  note: string;
  expiresAt: number;
}

const PaymentRouterAddress = "0xBEdA19E852341961789eF4d684098f80f155dCc7";

const Pay: React.FC = () => {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [qrData, setQrData] = useState("");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [parsedError, setParsedError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "approving" | "paying" | "success" | "error"
  >("idle");

  const { writeContract: approveWrite, data: approveHash } = useWriteContract();
  const { isLoading: isApproving, isSuccess: isApproved } =
    useWaitForTransactionReceipt({ hash: approveHash });

  const { writeContract: payWrite, data: payHash } = useWriteContract();
  const { isLoading: isPaying, status: payStatus } =
    useWaitForTransactionReceipt({ hash: payHash });

  useEffect(() => {
    if (qrData) {
      try {
        const parsed = JSON.parse(qrData);
        if (
          parsed.version === "pyusd-invoice-1" &&
          isAddress(parsed.merchant) &&
          parsed.amountWei
        ) {
          setInvoice(parsed);
          setParsedError(null);
        } else {
          setParsedError("Invalid invoice JSON.");
        }
      } catch {
        setParsedError("Invalid JSON or EIP-681 URI.");
      }
    }
  }, [qrData]);

  useEffect(() => {
    if (isApproved && invoice) {
      setPaymentStatus("paying");
      payWrite({
        address: PaymentRouterAddress,
        abi: paymentRouterAbi,
        functionName: "pay",
        args: [
          invoice.token as `0x${string}`,
          invoice.merchant as `0x${string}`,
          BigInt(invoice.amountWei),
          invoice.invoiceId as `0x${string}`, // invoiceId is bytes32
          BigInt(invoice.expiresAt),
        ],
      });
    }
  }, [isApproved, invoice, payWrite]);

  useEffect(() => {
    if (payStatus === "success") {
      setPaymentStatus("success");
      setTxHash(payHash!);
    }
  }, [payStatus, payHash]);

  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    const text = detectedCodes[0]?.rawValue;
    if (text) {
      setQrData(text);
      console.log("QR:", text);
    } else {
      console.log("No QR code detected");
    }
  };

  const handlePay = async () => {
    if (!invoice) return;

    if (Date.now() / 1000 > invoice.expiresAt) {
      alert("Invoice has expired.");
      return;
    }

    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    if (chainId !== sepolia.id) {
      alert("Please switch to Sepolia network.");
      switchChain({ chainId: sepolia.id });
      return;
    }

    setPaymentStatus("approving");
    approveWrite({
      address: invoice.token as `0x${string}`,
      abi: pyusdAbi,
      functionName: "approve",
      args: [PaymentRouterAddress, BigInt(invoice.amountWei)],
    });
  };

  const explorerLink = txHash
    ? `https://sepolia.etherscan.io/tx/${txHash}`
    : "#";

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Scan & Pay</h1>
        <DynamicWidget />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Scan QR Code</h2>
          <div className="w-96 h-96 mx-auto border border-gray-700 rounded-lg overflow-hidden mb-4">
            <Scanner
              onScan={handleScan}
              onError={(error) => console.error("Scanner Error:", error)}
            />
          </div>
          <h2 className="text-xl font-bold mb-4">Or Paste Invoice</h2>
          <textarea
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
            placeholder="Paste Invoice JSON or EIP-681 URI here..."
            value={qrData}
            onChange={(e) => setQrData(e.target.value)}
          ></textarea>
          {parsedError && <p className="text-red-500 mt-2">{parsedError}</p>}
        </div>

        {invoice && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Invoice Details</h2>
            <div className="space-y-2 mb-4">
              <p>
                <strong>Merchant:</strong> {invoice.merchant}
              </p>
              <p>
                <strong>Amount:</strong> {invoice.amount} PYUSD
              </p>
              <p>
                <strong>Note:</strong> {invoice.note}
              </p>
              <p>
                <strong>Invoice ID:</strong> {invoice.invoiceId}
              </p>
              <p>
                <strong>Expires At:</strong>{" "}
                {new Date(invoice.expiresAt * 1000).toLocaleString()}
              </p>
            </div>

            {paymentStatus === "idle" && (
              <button
                onClick={handlePay}
                className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Pay Invoice
              </button>
            )}

            {paymentStatus === "approving" && (
              <p className="text-yellow-500">
                Approving PYUSD... {isApproving && "(Waiting for confirmation)"}
              </p>
            )}
            {paymentStatus === "paying" && (
              <p className="text-yellow-500">
                Paying invoice... {isPaying && "(Waiting for confirmation)"}
              </p>
            )}
            {paymentStatus === "success" && (
              <div className="text-green-500">
                <p>Payment Successful!</p>
                <p>
                  Tx Hash:{" "}
                  <a
                    href={explorerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {txHash}
                  </a>
                </p>
              </div>
            )}
            {paymentStatus === "error" && (
              <p className="text-red-500">Payment Failed. Please try again.</p>
            )}

            {!isConnected && (
              <p className="text-red-500 mt-4">
                Please connect your wallet to pay.
              </p>
            )}
            {isConnected && chainId !== sepolia.id && (
              <button
                onClick={() => switchChain({ chainId: sepolia.id })}
                className="w-full bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mt-4"
              >
                Switch to Sepolia
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pay;
