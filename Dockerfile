FROM ubuntu:18.04
RUN apt-get update && apt-get install -y \
    locales \
&& apt-get clean \
&& rm -rf /var/lib/apt/lists/* \
&& localedef -i ja_JP -c -f UTF-8 -A /usr/share/locale/locale.alias ja_JP.UTF-8
COPY ./ /AnimeRec/
ENV DEBIAN_FRONTEND noninteractive
RUN cd /AnimeRec/ && ./install.sh
EXPOSE 8080 3001
ENV LANG ja_JP.utf8
