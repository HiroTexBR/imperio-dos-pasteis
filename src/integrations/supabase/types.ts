export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      adicionais: {
        Row: {
          ativo: boolean
          criado_em: string
          id: string
          nome: string
          ordem: number
          preco_extra: number
          tipo: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome: string
          ordem?: number
          preco_extra?: number
          tipo: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome?: string
          ordem?: number
          preco_extra?: number
          tipo?: string
        }
        Relationships: []
      }
      caixas: {
        Row: {
          aberto_em: string
          fechado_em: string | null
          id: string
          status: Database["public"]["Enums"]["status_caixa"]
          total_credito: number
          total_debito: number
          total_dinheiro: number
          total_geral: number
          total_pix: number
          usuario_id: string | null
          valor_final: number | null
          valor_inicial: number
        }
        Insert: {
          aberto_em?: string
          fechado_em?: string | null
          id?: string
          status?: Database["public"]["Enums"]["status_caixa"]
          total_credito?: number
          total_debito?: number
          total_dinheiro?: number
          total_geral?: number
          total_pix?: number
          usuario_id?: string | null
          valor_final?: number | null
          valor_inicial?: number
        }
        Update: {
          aberto_em?: string
          fechado_em?: string | null
          id?: string
          status?: Database["public"]["Enums"]["status_caixa"]
          total_credito?: number
          total_debito?: number
          total_dinheiro?: number
          total_geral?: number
          total_pix?: number
          usuario_id?: string | null
          valor_final?: number | null
          valor_inicial?: number
        }
        Relationships: [
          {
            foreignKeyName: "caixas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          ativo: boolean
          cor: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      comanda_item_adicionais: {
        Row: {
          adicional_id: string | null
          comanda_item_id: string
          criado_em: string
          id: string
          nome_adicional: string
          preco_cobrado: number
        }
        Insert: {
          adicional_id?: string | null
          comanda_item_id: string
          criado_em?: string
          id?: string
          nome_adicional: string
          preco_cobrado?: number
        }
        Update: {
          adicional_id?: string | null
          comanda_item_id?: string
          criado_em?: string
          id?: string
          nome_adicional?: string
          preco_cobrado?: number
        }
        Relationships: [
          {
            foreignKeyName: "comanda_item_adicionais_adicional_id_fkey"
            columns: ["adicional_id"]
            isOneToOne: false
            referencedRelation: "adicionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_item_adicionais_comanda_item_id_fkey"
            columns: ["comanda_item_id"]
            isOneToOne: false
            referencedRelation: "comanda_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      comanda_itens: {
        Row: {
          adicionais_texto: string | null
          atualizado_em: string
          comanda_id: string | null
          criado_em: string
          enviado_em: string | null
          enviado_para_producao: boolean
          garcom_id: string | null
          id: string
          nome_produto: string
          observacao: string | null
          preco_unitario: number
          produto_id: string | null
          quantidade: number
          status: Database["public"]["Enums"]["status_item"]
          total: number
          total_adicionais: number
        }
        Insert: {
          adicionais_texto?: string | null
          atualizado_em?: string
          comanda_id?: string | null
          criado_em?: string
          enviado_em?: string | null
          enviado_para_producao?: boolean
          garcom_id?: string | null
          id?: string
          nome_produto: string
          observacao?: string | null
          preco_unitario: number
          produto_id?: string | null
          quantidade?: number
          status?: Database["public"]["Enums"]["status_item"]
          total: number
          total_adicionais?: number
        }
        Update: {
          adicionais_texto?: string | null
          atualizado_em?: string
          comanda_id?: string | null
          criado_em?: string
          enviado_em?: string | null
          enviado_para_producao?: boolean
          garcom_id?: string | null
          id?: string
          nome_produto?: string
          observacao?: string | null
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          status?: Database["public"]["Enums"]["status_item"]
          total?: number
          total_adicionais?: number
        }
        Relationships: [
          {
            foreignKeyName: "comanda_itens_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_itens_garcom_id_fkey"
            columns: ["garcom_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      comandas: {
        Row: {
          aberta_em: string
          acrescimo: number
          caixa_id: string | null
          cliente_nome: string | null
          desconto_percentual: number
          desconto_reais: number
          fechada_em: string | null
          garcom_id: string | null
          id: string
          mesa_id: string | null
          numero: number
          observacoes: string | null
          status: Database["public"]["Enums"]["status_comanda"]
          subtotal: number
          taxa_servico: number
          total: number
        }
        Insert: {
          aberta_em?: string
          acrescimo?: number
          caixa_id?: string | null
          cliente_nome?: string | null
          desconto_percentual?: number
          desconto_reais?: number
          fechada_em?: string | null
          garcom_id?: string | null
          id?: string
          mesa_id?: string | null
          numero?: number
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_comanda"]
          subtotal?: number
          taxa_servico?: number
          total?: number
        }
        Update: {
          aberta_em?: string
          acrescimo?: number
          caixa_id?: string | null
          cliente_nome?: string | null
          desconto_percentual?: number
          desconto_reais?: number
          fechada_em?: string | null
          garcom_id?: string | null
          id?: string
          mesa_id?: string | null
          numero?: number
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_comanda"]
          subtotal?: number
          taxa_servico?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "comandas_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_garcom_id_fkey"
            columns: ["garcom_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_movimentacoes: {
        Row: {
          comanda_id: string | null
          criado_em: string
          id: string
          observacao: string | null
          produto_id: string | null
          quantidade: number
          quantidade_anterior: number | null
          quantidade_posterior: number | null
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          usuario_id: string | null
        }
        Insert: {
          comanda_id?: string | null
          criado_em?: string
          id?: string
          observacao?: string | null
          produto_id?: string | null
          quantidade: number
          quantidade_anterior?: number | null
          quantidade_posterior?: number | null
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          usuario_id?: string | null
        }
        Update: {
          comanda_id?: string | null
          criado_em?: string
          id?: string
          observacao?: string | null
          produto_id?: string | null
          quantidade?: number
          quantidade_anterior?: number | null
          quantidade_posterior?: number | null
          tipo?: Database["public"]["Enums"]["tipo_movimentacao"]
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      fila_impressao: {
        Row: {
          comanda_id: string | null
          conteudo: string
          criado_em: string
          erro: string | null
          id: string
          impresso_em: string | null
          impressora_id: string | null
          max_tentativas: number
          modo_simulacao: boolean
          pedido_producao_id: string | null
          proximo_retry_em: string | null
          status: Database["public"]["Enums"]["status_impressao"]
          tentativas: number
          tipo_documento: Database["public"]["Enums"]["tipo_documento"]
        }
        Insert: {
          comanda_id?: string | null
          conteudo: string
          criado_em?: string
          erro?: string | null
          id?: string
          impresso_em?: string | null
          impressora_id?: string | null
          max_tentativas?: number
          modo_simulacao?: boolean
          pedido_producao_id?: string | null
          proximo_retry_em?: string | null
          status?: Database["public"]["Enums"]["status_impressao"]
          tentativas?: number
          tipo_documento: Database["public"]["Enums"]["tipo_documento"]
        }
        Update: {
          comanda_id?: string | null
          conteudo?: string
          criado_em?: string
          erro?: string | null
          id?: string
          impresso_em?: string | null
          impressora_id?: string | null
          max_tentativas?: number
          modo_simulacao?: boolean
          pedido_producao_id?: string | null
          proximo_retry_em?: string | null
          status?: Database["public"]["Enums"]["status_impressao"]
          tentativas?: number
          tipo_documento?: Database["public"]["Enums"]["tipo_documento"]
        }
        Relationships: [
          {
            foreignKeyName: "fila_impressao_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_impressao_impressora_id_fkey"
            columns: ["impressora_id"]
            isOneToOne: false
            referencedRelation: "impressoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_impressao_pedido_producao_id_fkey"
            columns: ["pedido_producao_id"]
            isOneToOne: false
            referencedRelation: "pedidos_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_impressao_pedido_producao_id_fkey"
            columns: ["pedido_producao_id"]
            isOneToOne: false
            referencedRelation: "view_pedidos_producao_completo"
            referencedColumns: ["id"]
          },
        ]
      }
      impressoras: {
        Row: {
          ativa: boolean
          atualizado_em: string
          corte_automatico: boolean
          dispositivo_bluetooth: string | null
          endereco_ip: string | null
          id: string
          impressao_automatica: boolean
          largura_papel: Database["public"]["Enums"]["largura_papel"]
          modo_teste: boolean
          nome: string
          porta: number
          setor: Database["public"]["Enums"]["setor_impressora"]
          status: Database["public"]["Enums"]["status_impressora"]
          tipo_conexao: Database["public"]["Enums"]["tipo_conexao"]
          ultimo_erro: string | null
          ultimo_teste_em: string | null
        }
        Insert: {
          ativa?: boolean
          atualizado_em?: string
          corte_automatico?: boolean
          dispositivo_bluetooth?: string | null
          endereco_ip?: string | null
          id?: string
          impressao_automatica?: boolean
          largura_papel?: Database["public"]["Enums"]["largura_papel"]
          modo_teste?: boolean
          nome: string
          porta?: number
          setor: Database["public"]["Enums"]["setor_impressora"]
          status?: Database["public"]["Enums"]["status_impressora"]
          tipo_conexao?: Database["public"]["Enums"]["tipo_conexao"]
          ultimo_erro?: string | null
          ultimo_teste_em?: string | null
        }
        Update: {
          ativa?: boolean
          atualizado_em?: string
          corte_automatico?: boolean
          dispositivo_bluetooth?: string | null
          endereco_ip?: string | null
          id?: string
          impressao_automatica?: boolean
          largura_papel?: Database["public"]["Enums"]["largura_papel"]
          modo_teste?: boolean
          nome?: string
          porta?: number
          setor?: Database["public"]["Enums"]["setor_impressora"]
          status?: Database["public"]["Enums"]["status_impressora"]
          tipo_conexao?: Database["public"]["Enums"]["tipo_conexao"]
          ultimo_erro?: string | null
          ultimo_teste_em?: string | null
        }
        Relationships: []
      }
      insumo_movimentacoes: {
        Row: {
          criado_em: string
          id: string
          insumo_id: string | null
          observacao: string | null
          quantidade: number
          quantidade_anterior: number | null
          quantidade_posterior: number | null
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          usuario_id: string | null
        }
        Insert: {
          criado_em?: string
          id?: string
          insumo_id?: string | null
          observacao?: string | null
          quantidade: number
          quantidade_anterior?: number | null
          quantidade_posterior?: number | null
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          usuario_id?: string | null
        }
        Update: {
          criado_em?: string
          id?: string
          insumo_id?: string | null
          observacao?: string | null
          quantidade?: number
          quantidade_anterior?: number | null
          quantidade_posterior?: number | null
          tipo?: Database["public"]["Enums"]["tipo_movimentacao"]
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insumo_movimentacoes_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insumo_movimentacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      insumos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          codigo_interno: string | null
          criado_em: string
          descricao: string | null
          fornecedor: string | null
          id: string
          nome: string
          preco_custo: number | null
          quantidade_atual: number
          quantidade_minima: number
          unidade: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          codigo_interno?: string | null
          criado_em?: string
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          nome: string
          preco_custo?: number | null
          quantidade_atual?: number
          quantidade_minima?: number
          unidade?: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          codigo_interno?: string | null
          criado_em?: string
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          nome?: string
          preco_custo?: number | null
          quantidade_atual?: number
          quantidade_minima?: number
          unidade?: string
        }
        Relationships: []
      }
      logs_sistema: {
        Row: {
          acao: string
          criado_em: string
          descricao: string | null
          detalhes: Json | null
          id: string
          ip_origem: string | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          criado_em?: string
          descricao?: string | null
          detalhes?: Json | null
          id?: string
          ip_origem?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          criado_em?: string
          descricao?: string | null
          detalhes?: Json | null
          id?: string
          ip_origem?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_sistema_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      mesas: {
        Row: {
          ativa: boolean
          atualizado_em: string
          capacidade: number
          descricao: string | null
          id: string
          numero: number
          status: Database["public"]["Enums"]["status_mesa"]
        }
        Insert: {
          ativa?: boolean
          atualizado_em?: string
          capacidade?: number
          descricao?: string | null
          id?: string
          numero: number
          status?: Database["public"]["Enums"]["status_mesa"]
        }
        Update: {
          ativa?: boolean
          atualizado_em?: string
          capacidade?: number
          descricao?: string | null
          id?: string
          numero?: number
          status?: Database["public"]["Enums"]["status_mesa"]
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          caixa_id: string | null
          comanda_id: string | null
          criado_em: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id: string
          observacao: string | null
          troco: number
          usuario_id: string | null
          valor: number
          valor_recebido: number | null
        }
        Insert: {
          caixa_id?: string | null
          comanda_id?: string | null
          criado_em?: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          observacao?: string | null
          troco?: number
          usuario_id?: string | null
          valor: number
          valor_recebido?: number | null
        }
        Update: {
          caixa_id?: string | null
          comanda_id?: string | null
          criado_em?: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          observacao?: string | null
          troco?: number
          usuario_id?: string | null
          valor?: number
          valor_recebido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_itens: {
        Row: {
          comanda_item_id: string | null
          id: string
          nome_produto: string
          observacao: string | null
          pedido_producao_id: string | null
          produto_id: string | null
          quantidade: number
        }
        Insert: {
          comanda_item_id?: string | null
          id?: string
          nome_produto: string
          observacao?: string | null
          pedido_producao_id?: string | null
          produto_id?: string | null
          quantidade?: number
        }
        Update: {
          comanda_item_id?: string | null
          id?: string
          nome_produto?: string
          observacao?: string | null
          pedido_producao_id?: string | null
          produto_id?: string | null
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_comanda_item_id_fkey"
            columns: ["comanda_item_id"]
            isOneToOne: false
            referencedRelation: "comanda_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_pedido_producao_id_fkey"
            columns: ["pedido_producao_id"]
            isOneToOne: false
            referencedRelation: "pedidos_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_pedido_producao_id_fkey"
            columns: ["pedido_producao_id"]
            isOneToOne: false
            referencedRelation: "view_pedidos_producao_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_producao: {
        Row: {
          aceito_em: string | null
          comanda_id: string | null
          criado_em: string
          entregue_em: string | null
          garcom_id: string | null
          garcom_nome: string | null
          id: string
          mesa_id: string | null
          mesa_numero: number | null
          numero: number
          observacoes: string | null
          preparo_em: string | null
          pronto_em: string | null
          status: Database["public"]["Enums"]["status_pedido"]
          status_impressao: Database["public"]["Enums"]["status_impressao"]
        }
        Insert: {
          aceito_em?: string | null
          comanda_id?: string | null
          criado_em?: string
          entregue_em?: string | null
          garcom_id?: string | null
          garcom_nome?: string | null
          id?: string
          mesa_id?: string | null
          mesa_numero?: number | null
          numero?: number
          observacoes?: string | null
          preparo_em?: string | null
          pronto_em?: string | null
          status?: Database["public"]["Enums"]["status_pedido"]
          status_impressao?: Database["public"]["Enums"]["status_impressao"]
        }
        Update: {
          aceito_em?: string | null
          comanda_id?: string | null
          criado_em?: string
          entregue_em?: string | null
          garcom_id?: string | null
          garcom_nome?: string | null
          id?: string
          mesa_id?: string | null
          mesa_numero?: number | null
          numero?: number
          observacoes?: string | null
          preparo_em?: string | null
          pronto_em?: string | null
          status?: Database["public"]["Enums"]["status_pedido"]
          status_impressao?: Database["public"]["Enums"]["status_impressao"]
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_producao_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_producao_garcom_id_fkey"
            columns: ["garcom_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_producao_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_adicionais_config: {
        Row: {
          aceita_adicionais: boolean
          id: string
          max_gratis: number
          preco_por_extra: number
          produto_id: string
          tipo_adicional: string
        }
        Insert: {
          aceita_adicionais?: boolean
          id?: string
          max_gratis?: number
          preco_por_extra?: number
          produto_id: string
          tipo_adicional?: string
        }
        Update: {
          aceita_adicionais?: boolean
          id?: string
          max_gratis?: number
          preco_por_extra?: number
          produto_id?: string
          tipo_adicional?: string
        }
        Relationships: [
          {
            foreignKeyName: "produto_adicionais_config_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: true
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          categoria_id: string | null
          codigo_interno: string | null
          controlar_estoque: boolean
          descricao: string | null
          enviar_para_producao: boolean
          estoque_atual: number | null
          estoque_minimo: number | null
          foto_url: string | null
          id: string
          nome: string
          preco_custo: number | null
          preco_venda: number
          tempo_preparo_min: number
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          categoria_id?: string | null
          codigo_interno?: string | null
          controlar_estoque?: boolean
          descricao?: string | null
          enviar_para_producao?: boolean
          estoque_atual?: number | null
          estoque_minimo?: number | null
          foto_url?: string | null
          id?: string
          nome: string
          preco_custo?: number | null
          preco_venda?: number
          tempo_preparo_min?: number
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          categoria_id?: string | null
          codigo_interno?: string | null
          controlar_estoque?: boolean
          descricao?: string | null
          enviar_para_producao?: boolean
          estoque_atual?: number | null
          estoque_minimo?: number | null
          foto_url?: string | null
          id?: string
          nome?: string
          preco_custo?: number | null
          preco_venda?: number
          tempo_preparo_min?: number
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      testes_impressora: {
        Row: {
          conteudo_teste: string | null
          criado_em: string
          duracao_ms: number | null
          erro: string | null
          fila_impressao_id: string | null
          id: string
          impressora_id: string | null
          modo: string
          resultado: string
          tipo_teste: string | null
          usuario_id: string | null
        }
        Insert: {
          conteudo_teste?: string | null
          criado_em?: string
          duracao_ms?: number | null
          erro?: string | null
          fila_impressao_id?: string | null
          id?: string
          impressora_id?: string | null
          modo?: string
          resultado?: string
          tipo_teste?: string | null
          usuario_id?: string | null
        }
        Update: {
          conteudo_teste?: string | null
          criado_em?: string
          duracao_ms?: number | null
          erro?: string | null
          fila_impressao_id?: string | null
          id?: string
          impressora_id?: string | null
          modo?: string
          resultado?: string
          tipo_teste?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testes_impressora_fila_impressao_id_fkey"
            columns: ["fila_impressao_id"]
            isOneToOne: false
            referencedRelation: "fila_impressao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testes_impressora_impressora_id_fkey"
            columns: ["impressora_id"]
            isOneToOne: false
            referencedRelation: "impressoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testes_impressora_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          cargo: Database["public"]["Enums"]["cargo_usuario"]
          criado_em: string
          email: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          cargo?: Database["public"]["Enums"]["cargo_usuario"]
          criado_em?: string
          email: string
          id: string
          nome: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          cargo?: Database["public"]["Enums"]["cargo_usuario"]
          criado_em?: string
          email?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
    }
    Views: {
      dashboard_resumo: {
        Row: {
          comandas_abertas: number | null
          comandas_fechadas_hoje: number | null
          ticket_medio_hoje: number | null
          vendas_hoje: number | null
          vendas_mes: number | null
        }
        Relationships: []
      }
      view_pedidos_producao_completo: {
        Row: {
          aceito_em: string | null
          comanda_id: string | null
          criado_em: string | null
          entregue_em: string | null
          garcom_id: string | null
          garcom_nome: string | null
          id: string | null
          itens: Json | null
          mesa_id: string | null
          mesa_numero: number | null
          mesa_numero_view: number | null
          minutos_espera: number | null
          numero: number | null
          observacoes: string | null
          preparo_em: string | null
          pronto_em: string | null
          status: Database["public"]["Enums"]["status_pedido"] | null
          status_impressao:
            | Database["public"]["Enums"]["status_impressao"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_producao_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_producao_garcom_id_fkey"
            columns: ["garcom_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_producao_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_cargo: {
        Args: {
          _cargo: Database["public"]["Enums"]["cargo_usuario"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      cargo_usuario: "admin" | "caixa" | "garcom" | "producao"
      forma_pagamento: "dinheiro" | "pix" | "credito" | "debito" | "misto"
      largura_papel: "58mm" | "80mm"
      setor_impressora: "producao" | "caixa"
      status_caixa: "aberto" | "fechado"
      status_comanda:
        | "aberta"
        | "aguardando_pagamento"
        | "fechada"
        | "cancelada"
      status_impressao:
        | "pendente"
        | "imprimindo"
        | "impresso"
        | "falhou"
        | "reimpressao_solicitada"
        | "simulado"
        | "teste_enviado"
      status_impressora: "online" | "offline" | "erro" | "nao_configurada"
      status_item:
        | "pendente"
        | "enviado"
        | "em_preparo"
        | "pronto"
        | "entregue"
        | "cancelado"
      status_mesa:
        | "livre"
        | "ocupada"
        | "aguardando_pagamento"
        | "em_preparo"
        | "inativa"
      status_pedido: "novo" | "em_preparo" | "pronto" | "entregue" | "cancelado"
      tipo_conexao: "ethernet" | "wifi" | "bluetooth" | "usb"
      tipo_documento:
        | "pedido_producao"
        | "comanda_completa"
        | "novos_itens"
        | "recibo_final"
        | "fechamento_caixa"
        | "relatorio_diario"
        | "teste_simples"
        | "teste_completo"
        | "teste_corte"
        | "teste_acentuacao"
        | "teste_largura"
        | "balanco_estoque"
      tipo_movimentacao: "entrada" | "saida" | "ajuste" | "cancelamento"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cargo_usuario: ["admin", "caixa", "garcom", "producao"],
      forma_pagamento: ["dinheiro", "pix", "credito", "debito", "misto"],
      largura_papel: ["58mm", "80mm"],
      setor_impressora: ["producao", "caixa"],
      status_caixa: ["aberto", "fechado"],
      status_comanda: [
        "aberta",
        "aguardando_pagamento",
        "fechada",
        "cancelada",
      ],
      status_impressao: [
        "pendente",
        "imprimindo",
        "impresso",
        "falhou",
        "reimpressao_solicitada",
        "simulado",
        "teste_enviado",
      ],
      status_impressora: ["online", "offline", "erro", "nao_configurada"],
      status_item: [
        "pendente",
        "enviado",
        "em_preparo",
        "pronto",
        "entregue",
        "cancelado",
      ],
      status_mesa: [
        "livre",
        "ocupada",
        "aguardando_pagamento",
        "em_preparo",
        "inativa",
      ],
      status_pedido: ["novo", "em_preparo", "pronto", "entregue", "cancelado"],
      tipo_conexao: ["ethernet", "wifi", "bluetooth", "usb"],
      tipo_documento: [
        "pedido_producao",
        "comanda_completa",
        "novos_itens",
        "recibo_final",
        "fechamento_caixa",
        "relatorio_diario",
        "teste_simples",
        "teste_completo",
        "teste_corte",
        "teste_acentuacao",
        "teste_largura",
        "balanco_estoque",
      ],
      tipo_movimentacao: ["entrada", "saida", "ajuste", "cancelamento"],
    },
  },
} as const
