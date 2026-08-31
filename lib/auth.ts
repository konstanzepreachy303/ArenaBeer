import { cookies } from "next/headers";
import { SignJWT, jwtVerify, JWTPayload } from "jose";
import bcrypt from "bcryptjs";

type SessionPayload = JWTPayload & {
  id: string;
  email: string;
  role: string;
  name: string;
};

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret"
);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
) {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: {
  id: string;
  email: string;
  role: string;
  name: string;
}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get("session")?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function requireSession() {
  const s = await getSession();

  if (!s) {
    throw new Error("UNAUTHORIZED");
  }

  return s;
}

export function isAdmin(role?: string) {
  return role === "ADMIN";
}