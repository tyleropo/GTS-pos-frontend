// Polyfill for TextEncoder/TextDecoder (required by jsPDF and MSW)
// This file runs BEFORE setupFilesAfterEnv
const { TextEncoder, TextDecoder } = require('util')

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
