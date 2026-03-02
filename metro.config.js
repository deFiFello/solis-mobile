const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'cjs' support if any deps use CommonJS (common with some Solana libs)
config.resolver.sourceExts.push('cjs');

// Optional: Faster Metro (usually safe)
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
