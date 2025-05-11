-- Check permissions on auth.identities
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'identities' 
AND table_schema = 'auth';

-- Grant delete permission if needed
GRANT DELETE ON auth.identities TO postgres;