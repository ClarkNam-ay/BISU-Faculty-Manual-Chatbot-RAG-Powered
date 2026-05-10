import { createHmac, createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "bisu_admin_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error("ADMIN_PASSWORD is not configured");
  }

  return password;
}

function getSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    getAdminPassword()
  );
}

function hash(value: string) {
  return createHash("sha256").update(value).digest();
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safeEqual(left: string | Buffer, right: string | Buffer) {
  const leftBuffer = Buffer.isBuffer(left) ? left : Buffer.from(left);
  const rightBuffer = Buffer.isBuffer(right) ? right : Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function isValidAdminPassword(candidate: unknown) {
  if (typeof candidate !== "string") return false;
  return safeEqual(hash(candidate), hash(getAdminPassword()));
}

export function hasValidAdminSession(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!cookie) return false;

  const [version, expiresAt, signature] = cookie.split(".");
  if (version !== "v1" || !expiresAt || !signature) return false;

  const expiresAtMs = Number(expiresAt);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) return false;

  const payload = `${version}.${expiresAt}`;
  return safeEqual(signature, sign(payload));
}

export function setAdminSessionCookie(response: NextResponse) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `v1.${expiresAt}`;

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: `${payload}.${sign(payload)}`,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
