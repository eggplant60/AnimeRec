#!/bin/bash

NODE='/usr/bin/node'
PYTHON='/usr/bin/python'

cd $(dirname $0)
export NODE_PATH=$(npm root -g)

rm -f json/*.json

$NODE get_source.js
$NODE insert_db.js
$PYTHON insert_eid.py
