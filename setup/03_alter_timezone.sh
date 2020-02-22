#!/bin/bash

CONF_PATH='../conf/db.json'

db_user=$(cat $CONF_PATH | jq -r '.user')
db_host=$(cat $CONF_PATH | jq -r '.host')
db_password=$(cat $CONF_PATH | jq -r '.password')
db_port=$(cat $CONF_PATH | jq '.port')
database=$(cat $CONF_PATH | jq -r '.database')

echo "Alter database $database set timezone to Asia/Tokyo in $db_host:$db_port"

sudo -u postgres psql -c "ALTER DATABASE $database SET timezone TO 'Asia/Tokyo';"

if [ "$?" == '0' ]; then
	echo 'success!'
else
	echo 'failed!'
	exit 1
fi
