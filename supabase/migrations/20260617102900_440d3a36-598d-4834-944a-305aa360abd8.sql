DELETE FROM public.usuarios;
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users);
DELETE FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users);
DELETE FROM auth.users;