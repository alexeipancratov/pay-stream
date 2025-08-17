import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PaymentRouterModule = buildModule("PaymentRouterModule", (m) => {
  const paymentRouter = m.contract("PaymentRouter");

  return { paymentRouter };
});

export default PaymentRouterModule;