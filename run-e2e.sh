#!/bin/bash
cd /home/runner/workspace/artifacts/mobile
node_modules/.bin/playwright test --timeout=20000 --reporter=json --workers=1 > /home/runner/workspace/e2e.json 2> /home/runner/workspace/e2e.err
echo "EXIT=$?" >> /home/runner/workspace/e2e.err
