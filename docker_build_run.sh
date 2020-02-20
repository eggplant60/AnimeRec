#!/bin/bash

CONF_PATH='conf/system.json'

HOST_NAME=$(cat $CONF_PATH | jq -r '.host')
HTTP_PORT=$(cat $CONF_PATH | jq -r '.http')
NODE_PORT=$(cat $CONF_PATH | jq -r '.node')
IMAGE_NAME=$(cat $CONF_PATH | jq -r '.image')
CONTAINER_NAME=$(cat $CONF_PATH | jq -r '.container')

# web
cat mock/conf/environment.js.default \
    | sed -r "s/address: \"\"/address: \"$HOST_NAME\"/" \
    | sed -r "s/port   : \"\"/port   : \"$NODE_PORT\"/" \
    > mock/conf/environment.js

# build
docker build -t $IMAGE_NAME .

# run
docker run -it -p $HTTP_PORT:8080 -p $NODE_PORT:3001 \
       --name $CONTAINER_NAME \
       $IMAGE_NAME bash

