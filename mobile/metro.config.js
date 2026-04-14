const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Fix: socket.io-client ships an ESM build that Metro can't resolve (parseuri.js missing).
// Disabling package exports forces Metro to use the CJS build via the "main" field instead.
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: "./global.css" });
