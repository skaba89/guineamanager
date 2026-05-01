import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'preview-chat-9da002e7-6b15-464a-b118-d35f556c1461.space-z.ai',
    '.space.chatglm.site',
    '.space-z.ai',
  ],
};

export default nextConfig;
