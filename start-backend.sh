#!/bin/bash
cd /home/z/my-project/backend
exec node /home/z/my-project/backend/node_modules/.bin/ts-node-dev --respawn --transpile-only src/index.ts
