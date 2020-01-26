#!/bin/bash

WORK_DIR='/raid/work/animeRec/batch'
JSON_DIR='/raid/work/animeRec/batch/json'
NODE='/usr/bin/node'

export NODE_PATH=$(npm root -g)

cd $WORK_DIR

rm "$JSON_DIR/*.json"

$NODE get_source.js
$NODE insert_db.js 

