#!/bin/bash

./00_create_user.sh
./01_create_db.sh
node 02_create_table.js
./03_alter_timezone.sh
