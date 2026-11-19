INSERT INTO "categories" ("user_id", "type", "default_key")
SELECT u."id", d."type", d."default_key"
FROM "user" u
CROSS JOIN (VALUES
	('expense', 'food'),
	('expense', 'transport'),
	('expense', 'housing'),
	('expense', 'utilities'),
	('expense', 'health'),
	('expense', 'shopping'),
	('expense', 'entertainment'),
	('expense', 'other'),
	('income', 'salary'),
	('income', 'gifts'),
	('income', 'other')
) AS d("type", "default_key")
ON CONFLICT DO NOTHING;
