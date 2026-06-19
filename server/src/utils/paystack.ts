import crypto from "crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error("PAYSTACK_SECRET_KEY environment variable is not set");
  }
  return key;
}

interface InitializeTransactionParams {
  amountPesewas: number;
  email: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

interface InitializeTransactionResult {
  authorizationUrl: string;
  reference: string;
}

export async function initializeTransaction(
  params: InitializeTransactionParams
): Promise<InitializeTransactionResult> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountPesewas,
      currency: "GHS",
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });

  const body = (await response.json()) as {
    status: boolean;
    message?: string;
    data: { authorization_url: string; reference: string };
  };
  if (!response.ok || !body.status) {
    throw new Error(body.message || "Failed to initialize Paystack transaction");
  }

  return {
    authorizationUrl: body.data.authorization_url,
    reference: body.data.reference,
  };
}

interface VerifyTransactionResult {
  success: boolean;
  amountPesewas: number;
  reference: string;
}

export async function verifyTransaction(reference: string): Promise<VerifyTransactionResult> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${getSecretKey()}` },
  });

  const body = (await response.json()) as {
    status: boolean;
    message?: string;
    data: { status: string; amount: number; reference: string };
  };
  if (!response.ok || !body.status) {
    throw new Error(body.message || "Failed to verify Paystack transaction");
  }

  return {
    success: body.data.status === "success",
    amountPesewas: body.data.amount,
    reference: body.data.reference,
  };
}

export function verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!signatureHeader) return false;
  const expected = crypto.createHmac("sha512", getSecretKey()).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(signatureHeader, "utf8");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
