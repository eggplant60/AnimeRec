#!/bin/bash

http-server ./mock &
node ./node/chan_toru.js &
