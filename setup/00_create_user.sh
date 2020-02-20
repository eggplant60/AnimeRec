#!/bin/bash

CONF_PATH='../conf/db.json'

db_user=$(cat $CONF_PATH | jq -r '.user')
db_host=$(cat $CONF_PATH | jq -r '.host')
db_password=$(cat $CONF_PATH | jq -r '.password')
db_port=$(cat $CONF_PATH | jq '.port')
database=$(cat $CONF_PATH | jq -r '.database')

/etc/init.d/postgresql start

echo "Create user $db_user in $db_host:$db_port"

sudo -u postgres createuser -d -U postgres -P $db_user

if [ "$?" == '0' ]; then
	echo 'success!'
else
	echo 'failed!'
	exit 1
fi
