#!/bin/sh
set -e
cd /opt/watched
make deploy >> /opt/watched/deploy/deploy.log 2>&1
