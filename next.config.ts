import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "firebase-admin",
    "@google-cloud/kms",
    "google-gax",
    "encoding",
  ],
};

export default nextConfig;
