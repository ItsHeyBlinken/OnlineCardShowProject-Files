INSERT INTO users (
    name,
    email,
    password_hash,
    created_at,
    updated_at
) 
VALUES (
    'Test User',
    'test@example.com',
    '$2b$10$9XJiM82FLRqnB1Y09cVXqO5fqbSU8H4fFB1MkiQocUQL89Z8FR8OC', -- Paste the hash you just generated here
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING; 