@echo off
echo Starting Next.js with increased memory...
set NODE_OPTIONS=--max-old-space-size=8192
npm run dev:base