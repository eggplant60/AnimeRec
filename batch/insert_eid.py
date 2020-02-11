#!/usr/bin/python
# -*- coding: utf-8 -*-

import psycopg2   # handle PostgreSQL
import json
from time import sleep
from datetime import datetime
import requests
from pprint import pprint
import re

"""
eid更新の条件
1. eidカラムが""の行
(2. created_atカラムが当日中の行)
3. start_dateが現在以降の行
4. genre_idsが'107100' (国内アニメ)

変更するカラム
1. updated_at : 現在時刻
2. eid : イベントID取得APIから受け取った値
"""

target_genre = '%%107100%%'
sleep_sec = 3
url_api = 'https://tv.so-net.ne.jp/chan-toru/detail'
conf_path = '../conf/db.json'
headers_path = '../conf/chan_toru.json'

def get_event_id(area, sid, pid):
    response = requests.post(
        url_api, 
        data = {
            'type': 'bytime',
            'cat' : '1',
            'area': area, 
            'sid': sid, 
            'pid': pid
        },
        headers = headers
    )
    r_text = response.text
    re_eid = re.search(r'eid=([0-9]+)&', r_text)

    if (re_eid is None):
        print('Error: No match.')
        return None
    else:
        eid = re_eid.group(1)
        print('match, eid = ' + eid)
        return eid

if __name__ == '__main__':
    # 設定の読み込み
    with open(conf_path, 'r') as f:
        conf = json.load(f)

    with open(headers_path, 'r') as f:
        headers = json.load(f)
    
    with psycopg2.connect(
            host = conf['host'],
            port = conf['port'],
            database = conf['database'],
            user = conf['user'],
            password = conf['password']) as conn:
        
        with conn.cursor() as cur:

            today_str = datetime.now().strftime('%Y-%m-%d') # 日付
            now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S') # 現在
            cur.execute(
                """
                SELECT * FROM programs 
                WHERE event_id = '' 
                      -- AND created_at >= %s 
                      AND start_date >= %s
                      AND genre_ids LIKE %s;
                """,
                [today_str, now_str, target_genre]
            )
            rows = cur.fetchall()

            for i, row in enumerate(rows):
                print('-' * 40)
                print('{}/{}'.format(i+1, len(rows)))
                #pprint(row)
                print(row[6])
                print(row[7])
                print(row[-2])
                event_id = get_event_id(row[10], row[8], row[0])
                
                if (event_id is not None):
                    cur.execute(
                        """
                        UPDATE programs
                        SET updated_at = CURRENT_TIMESTAMP, event_id = %s
                        WHERE program_id = %s
                        """,
                        [event_id, row[0]]
                    )
                    print('event_id is valid {}'.format(event_id))
                
                sleep(sleep_sec)

            conn.commit()

print('complete!')
