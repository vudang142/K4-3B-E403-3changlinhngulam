import { networkInterfaces } from 'node:os'

const configuredAppHostname = (() => {
  try {
    return process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : null
  } catch {
    return null
  }
})()

const localNetworkHosts = Object.values(networkInterfaces())
  .flatMap((addresses) => addresses ?? [])
  .filter((address) => address.family === 'IPv4' && !address.internal)
  .map((address) => address.address)

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [...new Set([...localNetworkHosts, configuredAppHostname].filter(Boolean))],
  experimental: {
    useTypeScriptCli: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
