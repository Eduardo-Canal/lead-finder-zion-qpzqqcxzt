DO $$
BEGIN
  -- Confirma automaticamente todos os usuários existentes que ainda não possuem o e-mail confirmado.
  -- Isso corrige o erro HTTP 400 "Email not confirmed" ao tentar realizar o login.
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE email_confirmed_at IS NULL;
END $$;
