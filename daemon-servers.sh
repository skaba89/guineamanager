#!/bin/bash
# Persistent server daemon

cd /home/z/my-project/backend
node ./node_modules/.bin/ts-node-dev --respawn --transpile-only src/index.ts &
BACKEND_PID=$!

cd /home/z/my-project
node ./node_modules/.bin/next dev -p 3000 --turbopack &
FRONTEND_PID=$!

# Keep script alive
while true; do
    sleep 60
done
