anime_rec=# explain select count(*) from programs, program_genres where programs.program_id = program_genres.program_id;
                                      QUERY PLAN
--------------------------------------------------------------------------------------
 Aggregate  (cost=345.62..345.63 rows=1 width=8)
   ->  Hash Join  (cost=210.79..331.93 rows=5475 width=0)
         Hash Cond: ((program_genres.program_id)::text = (programs.program_id)::text)
         ->  Seq Scan on program_genres  (cost=0.00..106.75 rows=5475 width=19)
         ->  Hash  (cost=175.35..175.35 rows=2835 width=19)
               ->  Seq Scan on programs  (cost=0.00..175.35 rows=2835 width=19


anime_rec=# explain select count(*) from programs inner join program_genres on programs.program_id = program_genres.program_id;
                                      QUERY PLAN
--------------------------------------------------------------------------------------
 Aggregate  (cost=345.62..345.63 rows=1 width=8)
   ->  Hash Join  (cost=210.79..331.93 rows=5475 width=0)
         Hash Cond: ((program_genres.program_id)::text = (programs.program_id)::text)
         ->  Seq Scan on program_genres  (cost=0.00..106.75 rows=5475 width=19)
         ->  Hash  (cost=175.35..175.35 rows=2835 width=19)
               ->  Seq Scan on programs  (cost=0.00..175.35 rows=2835 width=19)


anime_rec=# explain select count(*) from programs A, program_genres B where A.program_id = B.program_id and B.genre_id = '107100';
                                      QUERY PLAN
---------------------------------------------------------------------------------------
 Aggregate  (cost=307.19..307.20 rows=1 width=8)
   ->  Hash Join  (cost=123.72..306.53 rows=263 width=0)
         Hash Cond: ((a.program_id)::text = (b.program_id)::text)
         ->  Seq Scan on programs a  (cost=0.00..175.35 rows=2835 width=19)
         ->  Hash  (cost=120.44..120.44 rows=263 width=19)
               ->  Seq Scan on program_genres b  (cost=0.00..120.44 rows=263 width=19)
                     Filter: ((genre_id)::text = '107100'::text)

anime_rec=# explain select count(*) from programs where genre_ids LIKE '%107100%';
                            QUERY PLAN
------------------------------------------------------------------
 Aggregate  (cost=183.15..183.16 rows=1 width=8)
   ->  Seq Scan on programs  (cost=0.00..182.44 rows=285 width=0)
         Filter: ((genre_ids)::text ~~ '%107100%'::text)

anime_rec=# explain select count(*) from (select * from program_genres where genre_id = '107100') T inner join programs V on T.program_id = V.program_id;
                                     QUERY PLAN
-------------------------------------------------------------------------------------
 Aggregate  (cost=307.19..307.20 rows=1 width=8)
   ->  Hash Join  (cost=123.72..306.53 rows=263 width=0)
         Hash Cond: ((v.program_id)::text = (program_genres.program_id)::text)
         ->  Seq Scan on programs v  (cost=0.00..175.35 rows=2835 width=19)
         ->  Hash  (cost=120.44..120.44 rows=263 width=19)
               ->  Seq Scan on program_genres  (cost=0.00..120.44 rows=263 width=19)
                     Filter: ((genre_id)::text = '107100'::text)

select count(*) from programs A where exists (select * from program_genres B where A.program_id = B.program_id and B.genre_id = '107100');


create index idx_program_genres_01 on program_genres (program_id);
create index idx_program_genres_02 on program_genres (genre_id);


anime_rec=# explain select count(*) from programs where genre_ids LIKE '%107100%' and start_date > '2020-01-29' and start_date < '2020-01-30';

 Aggregate  (cost=170.67..170.68 rows=1 width=8)
   ->  Bitmap Heap Scan on programs  (cost=16.39..170.57 rows=41 width=0)
         Recheck Cond: ((start_date > '2020-01-29 00:00:00+09'::timestamp with time zone) AND (start_date < '2020-01-30 00:00:00+09'::timestamp with time zone))
         Filter: ((genre_ids)::text ~~ '%107100%'::text)
         ->  Bitmap Index Scan on idx_programs_01  (cost=0.00..16.38 rows=410 width=0)
               Index Cond: ((start_date > '2020-01-29 00:00:00+09'::timestamp with time zone) AND (start_date < '2020-01-30 00:00:00+09'::timestamp with time zone))


SELECT COUNT(*) FROM programs AS P INNER JOIN program_genres AS G ON P.program_id = G.program_id
WHERE P.start_date >= '2020-01-29' AND P.start_date < '2020-01-30' AND G.genre_id = '107100';

 Aggregate  (cost=235.70..235.71 rows=1 width=8)
   ->  Hash Join  (cost=81.38..235.60 rows=38 width=0)
         Hash Cond: ((p.program_id)::text = (g.program_id)::text)
         ->  Bitmap Heap Scan on programs p  (cost=16.48..169.63 rows=410 width=19)
               Recheck Cond: ((start_date >= '2020-01-29 00:00:00+09'::timestamp with time zone) AND (start_date < '2020-01-30 00:00:00+09'::timestamp with time zone))
               ->  Bitmap Index Scan on idx_programs_01  (cost=0.00..16.38 rows=410 width=0)
                     Index Cond: ((start_date >= '2020-01-29 00:00:00+09'::timestamp with time zone) AND (start_date < '2020-01-30 00:00:00+09'::timestamp with time zone))
         ->  Hash  (cost=61.61..61.61 rows=263 width=19)
               ->  Bitmap Heap Scan on program_genres g  (cost=6.32..61.61 rows=263 width=19)
                     Recheck Cond: ((genre_id)::text = '107100'::text)
                     ->  Bitmap Index Scan on idx_program_genres_02  (cost=0.00..6.25 rows=263 width=0)
			     	 	      	
