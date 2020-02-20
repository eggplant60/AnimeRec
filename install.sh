#!/bin/bash

OPT_APT='-y'   # 対話的にインストールする場合はコメントアウト

apt-get update
apt-get install $OPT_APT curl gnupg lsb-release ca-certificates jq sudo

# PostgreSQL
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt-get update
apt-get install $OPT_APT postgresql

# node and npm modules
curl -sL https://deb.nodesource.com/setup_13.x | sudo -E bash -
apt-get update
apt-get install $OPT_APT nodejs
npm install
npm install -g http-server

# Python and Postgres' driver
apt-get install $OPT_APT python3-dev python3-pip libpq-dev
pip3 install -U psycopg2
pip3 install requests
rm /usr/bin/python
ln -s /usr/bin/python3 /usr/bin/python
