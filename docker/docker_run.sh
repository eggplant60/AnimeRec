#!/bin/bash

CONF_PATH='../conf/http_server.json'
DOCKER_IMAGE='ubuntu:18.04_ja'
HTTP_PORT='8081'
CONTAINER_NAME='anime_rec'
SHARED_DIR='/raid/work/animeRec'

docker run -it -p $HTTP_PORT:8080 \
       -v $SHARED_DIR:/shared \
       --name $CONTAINER_NAME \
       $DOCKER_IMAGE bash

#-e LANG="ja_JP.UTF-8" -e LANGUAGE="ja_JP:ja" -e LC_ALL="ja_JP.UTF-8" \
