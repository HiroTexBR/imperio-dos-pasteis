
-- Corrige views para usar security_invoker (respeitar RLS do usuário consultando)
DROP VIEW IF EXISTS public.dashboard_resumo;
CREATE VIEW public.dashboard_resumo
WITH (security_invoker = true) AS
SELECT
  COALESCE(SUM(CASE WHEN DATE(aberta_em)=CURRENT_DATE AND status='fechada' THEN total ELSE 0 END),0) AS vendas_hoje,
  COALESCE(SUM(CASE WHEN DATE_TRUNC('month',aberta_em)=DATE_TRUNC('month',NOW()) AND status='fechada' THEN total ELSE 0 END),0) AS vendas_mes,
  COUNT(CASE WHEN status='aberta' THEN 1 END) AS comandas_abertas,
  COUNT(CASE WHEN DATE(fechada_em)=CURRENT_DATE AND status='fechada' THEN 1 END) AS comandas_fechadas_hoje,
  COALESCE(AVG(CASE WHEN DATE(fechada_em)=CURRENT_DATE AND status='fechada' AND total>0 THEN total END),0) AS ticket_medio_hoje
FROM public.comandas;
GRANT SELECT ON public.dashboard_resumo TO authenticated;

DROP VIEW IF EXISTS public.view_pedidos_producao_completo;
CREATE VIEW public.view_pedidos_producao_completo
WITH (security_invoker = true) AS
SELECT pp.*,
  m.numero AS mesa_numero_view,
  COALESCE(json_agg(json_build_object('id',pi.id,'nome_produto',pi.nome_produto,'quantidade',pi.quantidade,'observacao',pi.observacao)) FILTER (WHERE pi.id IS NOT NULL), '[]'::json) AS itens,
  EXTRACT(EPOCH FROM (NOW()-pp.criado_em))/60 AS minutos_espera
FROM public.pedidos_producao pp
LEFT JOIN public.mesas m ON m.id=pp.mesa_id
LEFT JOIN public.pedido_itens pi ON pi.pedido_producao_id=pp.id
GROUP BY pp.id, m.numero;
GRANT SELECT ON public.view_pedidos_producao_completo TO authenticated;

-- =========================================================
-- SEEDS — CATEGORIAS
-- =========================================================
INSERT INTO public.categorias (nome, icone, cor, ordem) VALUES
  ('Pastéis Tradicionais','🥟','#F97316',1),
  ('Pastéis Doces','🍫','#A855F7',2),
  ('Pastéis Especiais','⭐','#EAB308',3),
  ('Bebidas','🥤','#3B82F6',4);

-- =========================================================
-- SEEDS — ADICIONAIS
-- =========================================================
INSERT INTO public.adicionais (nome, tipo, preco_extra, ordem) VALUES
  ('Bacon','salgado',1.00,1),('Calabresa','salgado',1.00,2),('Catupiry','salgado',1.00,3),
  ('Gueroba','salgado',1.00,4),('Pequi','salgado',1.00,5),('Azeitona','salgado',1.00,6),
  ('Cheddar','salgado',1.00,7),('Queijo','salgado',1.00,8),('Presunto','salgado',1.00,9),
  ('Milho','salgado',1.00,10),
  ('Morango','doce',1.00,11),('Canela','doce',1.00,12),('Banana','doce',1.00,13),
  ('Carne','recheio_extra',3.00,14),('Frango','recheio_extra',3.00,15),
  ('Costela Bovina','recheio_extra',3.00,16),('Carne Seca','recheio_extra',3.00,17);

-- =========================================================
-- SEEDS — PRODUTOS
-- =========================================================
DO $$
DECLARE
  cat_trad uuid; cat_doce uuid; cat_esp uuid; cat_beb uuid;
  prod_id uuid;
  trad_names text[] := ARRAY['Pastel de Queijo','Pastel de Frango','Pastel de Carne','Pastel de Costela Bovina','Pastel de Carne Seca'];
  doce_names text[] := ARRAY['Pastel de Nutella','Pastel de Queijo Doce','Pastel de Morango','Pastel de Canela','Pastel de Banana'];
  n text;
BEGIN
  SELECT id INTO cat_trad FROM public.categorias WHERE nome='Pastéis Tradicionais';
  SELECT id INTO cat_doce FROM public.categorias WHERE nome='Pastéis Doces';
  SELECT id INTO cat_esp  FROM public.categorias WHERE nome='Pastéis Especiais';
  SELECT id INTO cat_beb  FROM public.categorias WHERE nome='Bebidas';

  -- Tradicionais com adicionais salgados
  FOREACH n IN ARRAY trad_names LOOP
    INSERT INTO public.produtos (nome, categoria_id, preco_venda, enviar_para_producao, tempo_preparo_min)
      VALUES (n, cat_trad, 12.00, true, 8) RETURNING id INTO prod_id;
    INSERT INTO public.produto_adicionais_config (produto_id, aceita_adicionais, max_gratis, preco_por_extra, tipo_adicional)
      VALUES (prod_id, true, 2, 1.00, 'salgado');
  END LOOP;

  -- Pastel Pizza (tradicional sem adicionais)
  INSERT INTO public.produtos (nome, descricao, categoria_id, preco_venda, enviar_para_producao, tempo_preparo_min)
    VALUES ('Pastel Pizza','Queijo, presunto, calabresa e orégano', cat_trad, 12.00, true, 8) RETURNING id INTO prod_id;
  INSERT INTO public.produto_adicionais_config (produto_id, aceita_adicionais, tipo_adicional) VALUES (prod_id, false, 'salgado');

  -- Doces
  FOREACH n IN ARRAY doce_names LOOP
    INSERT INTO public.produtos (nome, categoria_id, preco_venda, enviar_para_producao, tempo_preparo_min)
      VALUES (n, cat_doce, 12.00, true, 8) RETURNING id INTO prod_id;
    INSERT INTO public.produto_adicionais_config (produto_id, aceita_adicionais, max_gratis, preco_por_extra, tipo_adicional)
      VALUES (prod_id, true, 2, 1.00, 'doce');
  END LOOP;

  -- Especiais
  INSERT INTO public.produtos (nome, descricao, categoria_id, preco_venda, enviar_para_producao, tempo_preparo_min)
    VALUES ('Pastel Império','Todos os recheios + 2 massas', cat_esp, 20.00, true, 12) RETURNING id INTO prod_id;
  INSERT INTO public.produto_adicionais_config (produto_id, aceita_adicionais, max_gratis, preco_por_extra, tipo_adicional)
    VALUES (prod_id, true, 2, 1.00, 'ambos');

  INSERT INTO public.produtos (nome, descricao, categoria_id, preco_venda, enviar_para_producao, tempo_preparo_min)
    VALUES ('Pastel Imperatriz','Todos os recheios + 1 massa', cat_esp, 16.00, true, 12) RETURNING id INTO prod_id;
  INSERT INTO public.produto_adicionais_config (produto_id, aceita_adicionais, max_gratis, preco_por_extra, tipo_adicional)
    VALUES (prod_id, true, 2, 1.00, 'ambos');

  INSERT INTO public.produtos (nome, descricao, categoria_id, preco_venda, enviar_para_producao, tempo_preparo_min)
    VALUES ('Pastel Vegetariano','Recheio vegetariano da casa', cat_esp, 13.00, true, 12) RETURNING id INTO prod_id;
  INSERT INTO public.produto_adicionais_config (produto_id, aceita_adicionais, tipo_adicional) VALUES (prod_id, false, 'salgado');

  -- Bebidas
  INSERT INTO public.produtos (nome, categoria_id, preco_venda, enviar_para_producao, tempo_preparo_min) VALUES
    ('Coca Cola 1LT',         cat_beb,  9.00, false, 0),
    ('Coca Cola 2LT',         cat_beb, 14.00, false, 0),
    ('Coca Cola KS',          cat_beb,  6.00, false, 0),
    ('Refrigerante 1LT',      cat_beb,  8.00, false, 0),
    ('Refrigerante 2LT',      cat_beb, 10.00, false, 0),
    ('Refrigerante Lata',     cat_beb,  6.00, false, 0),
    ('Água com Gás',          cat_beb,  5.00, false, 0),
    ('Água sem Gás',          cat_beb,  4.00, false, 0),
    ('Suco de Laranja Jarra', cat_beb, 18.00, false, 0),
    ('Suco de Laranja 400ml', cat_beb,  8.00, false, 0),
    ('Suco de Caixa 1LT',     cat_beb,  8.00, false, 0),
    ('Cerveja Lata',          cat_beb,  6.00, false, 0),
    ('Cerveja Long Neck',     cat_beb,  8.00, false, 0),
    ('Heineken',              cat_beb, 10.00, false, 0);
END $$;

-- =========================================================
-- SEEDS — MESAS (10 fora, 10 dentro, 10 delivery)
-- =========================================================
INSERT INTO public.mesas (numero, descricao, capacidade)
SELECT 100 + g, 'Área externa', 4 FROM generate_series(1,10) g
UNION ALL
SELECT 200 + g, 'Área interna', 4 FROM generate_series(1,10) g
UNION ALL
SELECT 300 + g, 'Delivery', 1 FROM generate_series(1,10) g;
