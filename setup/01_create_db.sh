#!/bin/bash

CONF_PATH='../conf/db.json'

db_user=$(cat $CONF_PATH | jq -r '.user')
db_host=$(cat $CONF_PATH | jq -r '.host')
db_password=$(cat $CONF_PATH | jq -r '.password')
db_port=$(cat $CONF_PATH | jq '.port')
database=$(cat $CONF_PATH | jq -r '.database')

echo "Create DB $database in $db_host:$db_port"

createdb -U $db_user \
	-h $db_host -p $db_port \
	--encoding='UTF-8'  --lc-collate='ja_JP.UTF-8' --lc-ctype='ja_JP.UTF-8' \
	--owner=$db_user --template=template0 \
	$database

if [ "$?" == '0' ]; then
	echo 'success!'
else
	echo 'failed!'
	exit 1
fi
