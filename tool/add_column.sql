ALTER TABLE programs ADD is_reserved boolean;
UPDATE programs SET is_reserved = FALSE;