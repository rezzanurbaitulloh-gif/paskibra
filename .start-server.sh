#!/bin/bash
export NODE_OPTIONS=--max-old-space-size=1536
cd /home/reja/paskibra
exec npx next start >> /home/reja/paskibra/.server.log 2>&1