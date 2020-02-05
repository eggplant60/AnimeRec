anime_rec=# EXPLAIN UPDATE programs SET is_reserved = false;
                             QUERY PLAN
---------------------------------------------------------------------
 Update on programs  (cost=0.00..655.12 rows=6612 width=396)
   ->  Seq Scan on programs  (cost=0.00..655.12 rows=6612 width=396)
(2 行)

anime_rec=# EXPLAIN UPDATE programs SET is_reserved = false WHERE is_reserved = true;
                            QUERY PLAN
------------------------------------------------------------------
 Update on programs  (cost=0.00..655.12 rows=1 width=396)
   ->  Seq Scan on programs  (cost=0.00..655.12 rows=1 width=396)
         Filter: is_reserved
(3 行)

anime_rec=# EXPLAIN UPDATE programs SET is_reserved = true WHERE event_id = '1111';
                                       QUERY PLAN
----------------------------------------------------------------------------------------
 Update on programs  (cost=0.28..8.30 rows=1 width=396)
   ->  Index Scan using idx_programs_07 on programs  (cost=0.28..8.30 rows=1 width=396)
         Index Cond: ((event_id)::text = '1111'::text)
(3 行)

anime_rec=# EXPLAIN UPDATE programs SET is_reserved = false WHERE start_date >= CURRENT_TIMESTAMP;
                             QUERY PLAN
---------------------------------------------------------------------
 Update on programs  (cost=0.00..688.18 rows=2963 width=396)
   ->  Seq Scan on programs  (cost=0.00..688.18 rows=2963 width=396)
         Filter: (start_date >= CURRENT_TIMESTAMP)
(3 行)


EXPLAIN UPDATE programs SET is_reserved = true WHERE event_id IN ('1111', '1112') AND start_date >= CURRENT_TIMESTAMP