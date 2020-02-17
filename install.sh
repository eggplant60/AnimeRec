#!/bin/bash

# 対話的にインストールする場合はコメントアウト
OPT_APT='-y'

apt-get update

# wget and curl
apt-get install $OPT_APT wget curl

# PostgreSQL
sh -c "echo 'deb http://apt.postgresql.org/pub/repos/apt/ xenial-pgdg main' > /etc/apt/sources.list.d/pgdg.list"
wget --quiet -O - http://apt.postgresql.org/pub/repos/apt/ACCC4CF8.asc | apt-key add -
apt-get update
apt-get install $OPT_APT postgresql

# node and modules
curl -sL https://deb.nodesource.com/setup_13.x | sudo -E bash -
apt-get update
apt-get install $OPT_APT nodejs
npm install

# Python and Postgres' driver
apt-get install $OPT_APT python3-dev python3-pip libpq-dev
pip3 install -U psycopg2
pip3 install requests

# jq, sudo and vim
apt-get install $OPT_APT jq sudo vim

# Language
#locale-gen ja_JP.UTF-8
#echo 'export LANG="ja_JP.UTF-8"' >> /root/.bashrc
#source /root/.bashrc
