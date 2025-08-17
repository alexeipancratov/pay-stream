import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PaymentRouterModule = buildModule("PaymentRouterModule_V2", (m) => {
  const paymentRouter = m.contract("PaymentRouter");

  return { paymentRouter };
});

export default PaymentRouterModule;