import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { v4 as uuidv4 } from "uuid";
import { parseUnits } from "viem";
import { QRCodeSVG } from "qrcode.react";
import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";

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

const Merchant: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { setShowAuthFlow } = useDynamicContext(); // ← open Dynamic modal

  const [merchantAddress, setMerchantAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [eip681Uri, setEip681Uri] = useState("");

  useEffect(() => {
    if (isConnected && address) {
      setMerchantAddress(address);
    }
  }, [isConnected, address]);

  const generateInvoice = () => {
    if (!merchantAddress || !amount) {
      alert("Merchant address and amount are required.");
      return;
    }

    const amountWei = parseUnits(amount, 6).toString();
    const newInvoiceId = uuidv4();
    const newInvoice: Invoice = {
      version: "pyusd-invoice-1",
      chainId: 11155111, // Sepolia
      token: "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9", // PYUSD on Sepolia
      merchant: merchantAddress,
      amount: amount,
      amountWei: amountWei,
      invoiceId: newInvoiceId,
      note: note,
      expiresAt: 0,
    };

    setInvoice(newInvoice);

    const uri = `ethereum:${newInvoice.token}/transfer?address=${newInvoice.merchant}&uint256=${newInvoice.amountWei}&chain_id=${newInvoice.chainId}`;
    setEip681Uri(uri);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-4">
          Welcome to the Merchant Page
        </h1>
        <button
          onClick={() => setShowAuthFlow(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Merchant Invoice Generator</h1>
        <DynamicWidget />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="mb-4">
            <label
              htmlFor="merchantAddress"
              className="block text-sm font-medium mb-1"
            >
              Merchant Address
            </label>
            <input
              type="text"
              id="merchantAddress"
              value={merchantAddress}
              onChange={(e) => setMerchantAddress(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium mb-1">
              Amount (PYUSD)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="note" className="block text-sm font-medium mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={generateInvoice}
            className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Generate Invoice
          </button>
        </div>

        {invoice && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Invoice Preview</h2>
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={JSON.stringify(invoice)} size={256} />
            </div>
            <div className="space-y-2">
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
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => handleCopy(JSON.stringify(invoice))}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Copy JSON
              </button>
              <button
                onClick={() => handleCopy(eip681Uri)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Copy URI
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Merchant;
