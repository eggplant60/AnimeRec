#!/bin/bash

CONF_PATH='conf/docker.json'
DOCKER_IMAGE='anime/rec'
HTTP_PORT=$(cat $CONF_PATH | jq -r '.http')
NODE_PORT=$(cat $CONF_PATH | jq -r '.node')
CONTAINER_NAME='anime_rec'

docker run -it -p $HTTP_PORT:8080 -p $NODE_PORT:3001 \
       --name $CONTAINER_NAME \
       $DOCKER_IMAGE bash

