#!/bin/bash

OPT_APT='-y'   # 対話的にインストールする場合はコメントアウト
BASH_RC='/root/.bashrc'

apt-get update
apt-get install $OPT_APT git

mkdir work
cd work
git clone https://github.com/eggplant60/AnimeRec.git
cd AnimeRec

# add repository
apt-get install $OPT_APT curl gnupg lsb-release ca-certificates

# jq, sudo and vim
apt-get install $OPT_APT jq sudo vim

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

# Python and Postgres' driver
apt-get install $OPT_APT python3-dev python3-pip libpq-dev
alias python='python3'
alias pip='pip3'
pip install -U psycopg2
pip install requests
rm /usr/bin/python
ln -s /usr/bin/python3.6 /usr/bin/python
