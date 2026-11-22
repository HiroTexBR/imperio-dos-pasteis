
-- =========================================================
-- IMPÉRIO DOS PASTÉIS — FUNDAÇÃO (Fase 1)
-- =========================================================

-- ENUMS
CREATE TYPE cargo_usuario      AS ENUM ('admin','caixa','garcom','producao');
CREATE TYPE status_mesa        AS ENUM ('livre','ocupada','aguardando_pagamento','em_preparo','inativa');
CREATE TYPE status_comanda     AS ENUM ('aberta','aguardando_pagamento','fechada','cancelada');
CREATE TYPE status_item        AS ENUM ('pendente','enviado','em_preparo','pronto','entregue','cancelado');
CREATE TYPE status_pedido      AS ENUM ('novo','em_preparo','pronto','entregue','cancelado');
CREATE TYPE status_impressao   AS ENUM ('pendente','imprimindo','impresso','falhou','reimpressao_solicitada','simulado','teste_enviado');
CREATE TYPE tipo_conexao       AS ENUM ('ethernet','wifi','bluetooth','usb');
CREATE TYPE largura_papel      AS ENUM ('58mm','80mm');
CREATE TYPE status_impressora  AS ENUM ('online','offline','erro','nao_configurada');
CREATE TYPE setor_impressora   AS ENUM ('producao','caixa');
CREATE TYPE tipo_documento     AS ENUM ('pedido_producao','comanda_completa','novos_itens','recibo_final','fechamento_caixa','relatorio_diario','teste_simples','teste_completo','teste_corte','teste_acentuacao','teste_largura','balanco_estoque');
CREATE TYPE tipo_movimentacao  AS ENUM ('entrada','saida','ajuste','cancelamento');
CREATE TYPE forma_pagamento    AS ENUM ('dinheiro','pix','credito','debito','misto');
CREATE TYPE status_caixa       AS ENUM ('aberto','fechado');

-- =========================================================
-- TABELAS
-- =========================================================

-- 4. USUÁRIOS (espelha auth.users) — criada primeiro p/ FKs
CREATE TABLE public.usuarios (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome varchar(200) NOT NULL,
  email varchar(200) NOT NULL,
  cargo cargo_usuario NOT NULL DEFAULT 'garcom',
  ativo boolean NOT NULL DEFAULT true,
  avatar_url text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios TO authenticated;
GRANT ALL ON public.usuarios TO service_role;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Função SECURITY DEFINER para verificar cargo (evita recursão em RLS)
CREATE OR REPLACE FUNCTION public.has_cargo(_user_id uuid, _cargo cargo_usuario)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.usuarios WHERE id = _user_id AND cargo = _cargo AND ativo = true)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.usuarios WHERE id = _user_id AND cargo = 'admin' AND ativo = true)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.usuarios WHERE id = _user_id AND ativo = true)
$$;

-- Policies usuarios
CREATE POLICY "usuarios_self_read" ON public.usuarios FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "usuarios_self_update" ON public.usuarios FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin(auth.uid())) WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "usuarios_admin_insert" ON public.usuarios FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "usuarios_admin_delete" ON public.usuarios FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Trigger: cria perfil quando user assina
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email, cargo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)),
    NEW.email,
    -- primeiro usuário do sistema vira admin automaticamente
    CASE WHEN (SELECT COUNT(*) FROM public.usuarios) = 0 THEN 'admin'::cargo_usuario ELSE 'garcom'::cargo_usuario END
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 1. CATEGORIAS
CREATE TABLE public.categorias (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome varchar(100) NOT NULL,
  icone varchar(10),
  cor varchar(7),
  ordem int NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categorias_read_all" ON public.categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "categorias_admin_write" ON public.categorias FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 2. PRODUTOS
CREATE TABLE public.produtos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome varchar(200) NOT NULL,
  descricao text,
  categoria_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  preco_venda numeric(10,2) NOT NULL DEFAULT 0,
  preco_custo numeric(10,2) DEFAULT 0,
  foto_url text,
  estoque_atual numeric(10,3) DEFAULT 0,
  estoque_minimo numeric(10,3) DEFAULT 0,
  controlar_estoque boolean NOT NULL DEFAULT false,
  enviar_para_producao boolean NOT NULL DEFAULT true,
  tempo_preparo_min int NOT NULL DEFAULT 8,
  codigo_interno varchar(50),
  ativo boolean NOT NULL DEFAULT true,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "produtos_read_all" ON public.produtos FOR SELECT TO authenticated USING (true);
CREATE POLICY "produtos_admin_write" ON public.produtos FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 3. MESAS
CREATE TABLE public.mesas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  numero int UNIQUE NOT NULL,
  descricao text,
  capacidade int NOT NULL DEFAULT 4,
  status status_mesa NOT NULL DEFAULT 'livre',
  ativa boolean NOT NULL DEFAULT true,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mesas TO authenticated;
GRANT ALL ON public.mesas TO service_role;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mesas_read_all" ON public.mesas FOR SELECT TO authenticated USING (true);
CREATE POLICY "mesas_staff_update_status" ON public.mesas FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "mesas_admin_insert" ON public.mesas FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "mesas_admin_delete" ON public.mesas FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- 5. CAIXAS
CREATE TABLE public.caixas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id uuid REFERENCES public.usuarios(id),
  status status_caixa NOT NULL DEFAULT 'aberto',
  valor_inicial numeric(10,2) NOT NULL DEFAULT 0,
  valor_final numeric(10,2),
  total_dinheiro numeric(10,2) NOT NULL DEFAULT 0,
  total_pix numeric(10,2) NOT NULL DEFAULT 0,
  total_credito numeric(10,2) NOT NULL DEFAULT 0,
  total_debito numeric(10,2) NOT NULL DEFAULT 0,
  total_geral numeric(10,2) NOT NULL DEFAULT 0,
  aberto_em timestamptz NOT NULL DEFAULT now(),
  fechado_em timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.caixas TO authenticated;
GRANT ALL ON public.caixas TO service_role;
ALTER TABLE public.caixas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "caixas_staff_read" ON public.caixas FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "caixas_caixa_admin_write" ON public.caixas FOR ALL TO authenticated USING (public.is_admin(auth.uid()) OR public.has_cargo(auth.uid(),'caixa')) WITH CHECK (public.is_admin(auth.uid()) OR public.has_cargo(auth.uid(),'caixa'));

-- 6. COMANDAS
CREATE TABLE public.comandas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  numero serial,
  mesa_id uuid REFERENCES public.mesas(id),
  cliente_nome varchar(200),
  garcom_id uuid REFERENCES public.usuarios(id),
  caixa_id uuid REFERENCES public.caixas(id),
  status status_comanda NOT NULL DEFAULT 'aberta',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  desconto_reais numeric(10,2) NOT NULL DEFAULT 0,
  desconto_percentual numeric(5,2) NOT NULL DEFAULT 0,
  taxa_servico numeric(10,2) NOT NULL DEFAULT 0,
  acrescimo numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  observacoes text,
  aberta_em timestamptz NOT NULL DEFAULT now(),
  fechada_em timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comandas TO authenticated;
GRANT ALL ON public.comandas TO service_role;
ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comandas_staff_read" ON public.comandas FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "comandas_staff_write" ON public.comandas FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 7. COMANDA_ITENS
CREATE TABLE public.comanda_itens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comanda_id uuid REFERENCES public.comandas(id) ON DELETE CASCADE,
  produto_id uuid REFERENCES public.produtos(id),
  nome_produto varchar(200) NOT NULL,
  quantidade int NOT NULL DEFAULT 1,
  preco_unitario numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,
  total_adicionais numeric(10,2) NOT NULL DEFAULT 0,
  adicionais_texto text,
  observacao text,
  status status_item NOT NULL DEFAULT 'pendente',
  enviado_para_producao boolean NOT NULL DEFAULT false,
  enviado_em timestamptz,
  garcom_id uuid REFERENCES public.usuarios(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comanda_itens TO authenticated;
GRANT ALL ON public.comanda_itens TO service_role;
ALTER TABLE public.comanda_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comanda_itens_staff_all" ON public.comanda_itens FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 8. PEDIDOS_PRODUCAO
CREATE TABLE public.pedidos_producao (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  numero serial,
  comanda_id uuid REFERENCES public.comandas(id),
  mesa_id uuid REFERENCES public.mesas(id),
  mesa_numero int,
  garcom_id uuid REFERENCES public.usuarios(id),
  garcom_nome varchar(200),
  status status_pedido NOT NULL DEFAULT 'novo',
  status_impressao status_impressao NOT NULL DEFAULT 'pendente',
  observacoes text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  aceito_em timestamptz,
  preparo_em timestamptz,
  pronto_em timestamptz,
  entregue_em timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos_producao TO authenticated;
GRANT ALL ON public.pedidos_producao TO service_role;
ALTER TABLE public.pedidos_producao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pedidos_staff_all" ON public.pedidos_producao FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 9. PEDIDO_ITENS
CREATE TABLE public.pedido_itens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_producao_id uuid REFERENCES public.pedidos_producao(id) ON DELETE CASCADE,
  comanda_item_id uuid REFERENCES public.comanda_itens(id),
  produto_id uuid REFERENCES public.produtos(id),
  nome_produto varchar(200) NOT NULL,
  quantidade int NOT NULL DEFAULT 1,
  observacao text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_itens TO authenticated;
GRANT ALL ON public.pedido_itens TO service_role;
ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pedido_itens_staff_all" ON public.pedido_itens FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 10. PAGAMENTOS
CREATE TABLE public.pagamentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comanda_id uuid REFERENCES public.comandas(id),
  caixa_id uuid REFERENCES public.caixas(id),
  usuario_id uuid REFERENCES public.usuarios(id),
  forma_pagamento forma_pagamento NOT NULL,
  valor numeric(10,2) NOT NULL,
  valor_recebido numeric(10,2),
  troco numeric(10,2) NOT NULL DEFAULT 0,
  observacao text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagamentos TO authenticated;
GRANT ALL ON public.pagamentos TO service_role;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pagamentos_staff_read" ON public.pagamentos FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "pagamentos_caixa_write" ON public.pagamentos FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()) OR public.has_cargo(auth.uid(),'caixa'));

-- 11. IMPRESSORAS
CREATE TABLE public.impressoras (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome varchar(200) NOT NULL,
  setor setor_impressora NOT NULL,
  tipo_conexao tipo_conexao NOT NULL DEFAULT 'ethernet',
  endereco_ip varchar(15),
  porta int NOT NULL DEFAULT 9100,
  dispositivo_bluetooth varchar(200),
  largura_papel largura_papel NOT NULL DEFAULT '80mm',
  corte_automatico boolean NOT NULL DEFAULT true,
  impressao_automatica boolean NOT NULL DEFAULT true,
  modo_teste boolean NOT NULL DEFAULT false,
  ativa boolean NOT NULL DEFAULT true,
  status status_impressora NOT NULL DEFAULT 'nao_configurada',
  ultimo_teste_em timestamptz,
  ultimo_erro text,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.impressoras TO authenticated;
GRANT ALL ON public.impressoras TO service_role;
ALTER TABLE public.impressoras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "impressoras_staff_read" ON public.impressoras FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "impressoras_admin_write" ON public.impressoras FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 12. FILA_IMPRESSAO
CREATE TABLE public.fila_impressao (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_documento tipo_documento NOT NULL,
  comanda_id uuid REFERENCES public.comandas(id),
  pedido_producao_id uuid REFERENCES public.pedidos_producao(id),
  impressora_id uuid REFERENCES public.impressoras(id),
  conteudo text NOT NULL,
  status status_impressao NOT NULL DEFAULT 'pendente',
  tentativas int NOT NULL DEFAULT 0,
  max_tentativas int NOT NULL DEFAULT 3,
  erro text,
  modo_simulacao boolean NOT NULL DEFAULT false,
  proximo_retry_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  impresso_em timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fila_impressao TO authenticated;
GRANT ALL ON public.fila_impressao TO service_role;
ALTER TABLE public.fila_impressao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fila_staff_all" ON public.fila_impressao FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 13. TESTES_IMPRESSORA
CREATE TABLE public.testes_impressora (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  impressora_id uuid REFERENCES public.impressoras(id),
  usuario_id uuid REFERENCES public.usuarios(id),
  tipo_teste varchar(100),
  modo varchar(20) NOT NULL DEFAULT 'simulacao',
  resultado varchar(20) NOT NULL DEFAULT 'pendente',
  conteudo_teste text,
  fila_impressao_id uuid REFERENCES public.fila_impressao(id),
  erro text,
  duracao_ms int,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testes_impressora TO authenticated;
GRANT ALL ON public.testes_impressora TO service_role;
ALTER TABLE public.testes_impressora ENABLE ROW LEVEL SECURITY;
CREATE POLICY "testes_admin_caixa" ON public.testes_impressora FOR ALL TO authenticated USING (public.is_admin(auth.uid()) OR public.has_cargo(auth.uid(),'caixa')) WITH CHECK (public.is_admin(auth.uid()) OR public.has_cargo(auth.uid(),'caixa'));

-- 14. ESTOQUE_MOVIMENTACOES
CREATE TABLE public.estoque_movimentacoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id uuid REFERENCES public.produtos(id),
  tipo tipo_movimentacao NOT NULL,
  quantidade numeric(10,3) NOT NULL,
  quantidade_anterior numeric(10,3),
  quantidade_posterior numeric(10,3),
  usuario_id uuid REFERENCES public.usuarios(id),
  comanda_id uuid REFERENCES public.comandas(id),
  observacao text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque_movimentacoes TO authenticated;
GRANT ALL ON public.estoque_movimentacoes TO service_role;
ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "estoque_mov_staff" ON public.estoque_movimentacoes FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 15. LOGS_SISTEMA
CREATE TABLE public.logs_sistema (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id uuid REFERENCES public.usuarios(id),
  acao varchar(100) NOT NULL,
  descricao text,
  detalhes jsonb,
  ip_origem varchar(45),
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logs_sistema TO authenticated;
GRANT ALL ON public.logs_sistema TO service_role;
ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_admin_read" ON public.logs_sistema FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "logs_staff_insert" ON public.logs_sistema FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- =========================================================
-- ADICIONAIS
-- =========================================================
CREATE TABLE public.adicionais (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('salgado','doce','recheio_extra')),
  preco_extra numeric(10,2) NOT NULL DEFAULT 1.00,
  ativo boolean NOT NULL DEFAULT true,
  ordem int NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adicionais TO authenticated;
GRANT ALL ON public.adicionais TO service_role;
ALTER TABLE public.adicionais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adicionais_read_all" ON public.adicionais FOR SELECT TO authenticated USING (true);
CREATE POLICY "adicionais_admin_write" ON public.adicionais FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.produto_adicionais_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  aceita_adicionais boolean NOT NULL DEFAULT true,
  max_gratis int NOT NULL DEFAULT 2,
  preco_por_extra numeric(10,2) NOT NULL DEFAULT 1.00,
  tipo_adicional text NOT NULL DEFAULT 'salgado' CHECK (tipo_adicional IN ('salgado','doce','ambos')),
  UNIQUE (produto_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produto_adicionais_config TO authenticated;
GRANT ALL ON public.produto_adicionais_config TO service_role;
ALTER TABLE public.produto_adicionais_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pac_read_all" ON public.produto_adicionais_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "pac_admin_write" ON public.produto_adicionais_config FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.comanda_item_adicionais (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comanda_item_id uuid NOT NULL REFERENCES public.comanda_itens(id) ON DELETE CASCADE,
  adicional_id uuid REFERENCES public.adicionais(id),
  nome_adicional text NOT NULL,
  preco_cobrado numeric(10,2) NOT NULL DEFAULT 0.00,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comanda_item_adicionais TO authenticated;
GRANT ALL ON public.comanda_item_adicionais TO service_role;
ALTER TABLE public.comanda_item_adicionais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cia_staff" ON public.comanda_item_adicionais FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========================================================
-- INSUMOS
-- =========================================================
CREATE TABLE public.insumos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome varchar(200) NOT NULL,
  descricao text,
  unidade varchar(20) NOT NULL DEFAULT 'un',
  quantidade_atual numeric(10,3) NOT NULL DEFAULT 0,
  quantidade_minima numeric(10,3) NOT NULL DEFAULT 0,
  preco_custo numeric(10,2) DEFAULT 0,
  fornecedor varchar(200),
  codigo_interno varchar(50),
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insumos TO authenticated;
GRANT ALL ON public.insumos TO service_role;
ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insumos_staff_read" ON public.insumos FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "insumos_admin_write" ON public.insumos FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.insumo_movimentacoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  insumo_id uuid REFERENCES public.insumos(id) ON DELETE CASCADE,
  tipo tipo_movimentacao NOT NULL,
  quantidade numeric(10,3) NOT NULL,
  quantidade_anterior numeric(10,3),
  quantidade_posterior numeric(10,3),
  usuario_id uuid REFERENCES public.usuarios(id),
  observacao text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insumo_movimentacoes TO authenticated;
GRANT ALL ON public.insumo_movimentacoes TO service_role;
ALTER TABLE public.insumo_movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insumo_mov_admin" ON public.insumo_movimentacoes FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- TRIGGERS GENÉRICOS
-- =========================================================
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END; $$;

CREATE TRIGGER set_updated_at_mesas       BEFORE UPDATE ON public.mesas        FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at_produtos    BEFORE UPDATE ON public.produtos     FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at_impressoras BEFORE UPDATE ON public.impressoras  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at_ci          BEFORE UPDATE ON public.comanda_itens FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at_insumos     BEFORE UPDATE ON public.insumos      FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- Recalcula totais da comanda
CREATE OR REPLACE FUNCTION public.recalcular_total_comanda()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE cmd_id uuid; v_sub numeric; v_desc_r numeric; v_desc_p numeric; v_taxa numeric; v_acre numeric;
BEGIN
  cmd_id := COALESCE(NEW.comanda_id, OLD.comanda_id);
  SELECT COALESCE(SUM(total + COALESCE(total_adicionais,0)),0) INTO v_sub FROM public.comanda_itens WHERE comanda_id=cmd_id AND status!='cancelado';
  SELECT COALESCE(desconto_reais,0), COALESCE(desconto_percentual,0), COALESCE(taxa_servico,0), COALESCE(acrescimo,0)
    INTO v_desc_r, v_desc_p, v_taxa, v_acre FROM public.comandas WHERE id=cmd_id;
  UPDATE public.comandas SET subtotal=v_sub,
    total=GREATEST(0, v_sub - v_desc_r - (v_sub*v_desc_p/100) + v_taxa + v_acre)
  WHERE id=cmd_id;
  RETURN COALESCE(NEW,OLD);
END; $$;

CREATE TRIGGER recalc_total AFTER INSERT OR UPDATE OR DELETE ON public.comanda_itens FOR EACH ROW EXECUTE FUNCTION public.recalcular_total_comanda();

-- Status da mesa segue status da comanda
CREATE OR REPLACE FUNCTION public.atualizar_status_mesa()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP='INSERT' AND NEW.status='aberta' AND NEW.mesa_id IS NOT NULL THEN
    UPDATE public.mesas SET status='ocupada' WHERE id=NEW.mesa_id;
  ELSIF TG_OP='UPDATE' AND NEW.mesa_id IS NOT NULL THEN
    IF NEW.status='fechada' OR NEW.status='cancelada' THEN
      IF NOT EXISTS(SELECT 1 FROM public.comandas WHERE mesa_id=NEW.mesa_id AND status='aberta' AND id!=NEW.id) THEN
        UPDATE public.mesas SET status='livre' WHERE id=NEW.mesa_id;
      END IF;
    ELSIF NEW.status='aguardando_pagamento' THEN
      UPDATE public.mesas SET status='aguardando_pagamento' WHERE id=NEW.mesa_id;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER update_mesa_status AFTER INSERT OR UPDATE ON public.comandas FOR EACH ROW EXECUTE FUNCTION public.atualizar_status_mesa();

-- =========================================================
-- VIEWS
-- =========================================================
CREATE OR REPLACE VIEW public.dashboard_resumo AS
SELECT
  COALESCE(SUM(CASE WHEN DATE(aberta_em)=CURRENT_DATE AND status='fechada' THEN total ELSE 0 END),0) AS vendas_hoje,
  COALESCE(SUM(CASE WHEN DATE_TRUNC('month',aberta_em)=DATE_TRUNC('month',NOW()) AND status='fechada' THEN total ELSE 0 END),0) AS vendas_mes,
  COUNT(CASE WHEN status='aberta' THEN 1 END) AS comandas_abertas,
  COUNT(CASE WHEN DATE(fechada_em)=CURRENT_DATE AND status='fechada' THEN 1 END) AS comandas_fechadas_hoje,
  COALESCE(AVG(CASE WHEN DATE(fechada_em)=CURRENT_DATE AND status='fechada' AND total>0 THEN total END),0) AS ticket_medio_hoje
FROM public.comandas;
GRANT SELECT ON public.dashboard_resumo TO authenticated;

CREATE OR REPLACE VIEW public.view_pedidos_producao_completo AS
SELECT pp.*,
  m.numero AS mesa_numero_view,
  COALESCE(json_agg(json_build_object('id',pi.id,'nome_produto',pi.nome_produto,'quantidade',pi.quantidade,'observacao',pi.observacao)) FILTER (WHERE pi.id IS NOT NULL), '[]'::json) AS itens,
  EXTRACT(EPOCH FROM (NOW()-pp.criado_em))/60 AS minutos_espera
FROM public.pedidos_producao pp
LEFT JOIN public.mesas m ON m.id=pp.mesa_id
LEFT JOIN public.pedido_itens pi ON pi.pedido_producao_id=pp.id
GROUP BY pp.id, m.numero;
GRANT SELECT ON public.view_pedidos_producao_completo TO authenticated;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.comandas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comanda_itens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos_producao;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedido_itens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mesas;
