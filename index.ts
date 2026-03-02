// Polyfills MUST be imported before anything else
import "react-native-get-random-values"; // crypto.getRandomValues for Solana libs
import { Buffer } from "buffer";
global.Buffer = Buffer as any;

// Now load the app
import "expo-router/entry";
