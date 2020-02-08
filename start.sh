#!/bin/bash

http-server ./mock &
node ./node/app.js &
