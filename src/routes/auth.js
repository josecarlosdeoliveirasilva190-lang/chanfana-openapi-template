// src/routes/auth.js
// Rotas de autenticação

const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { gerarToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }

    const result = await query(
      `SELECT u.*, t.slug as tenant_slug, t.nome as tenant_nome
       FROM usuarios u
       JOIN tenants t ON u.tenant_id = t.id
       WHERE u.email = $1 AND u.ativo = true`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const usuario = result.rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const token = gerarToken(usuario);

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        tenant: {
          id: usuario.tenant_id,
          nome: usuario.tenant_nome,
          slug: usuario.tenant_slug
        }
      }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// POST /api/auth/registrar
router.post('/registrar', async (req, res) => {
  try {
    const { nome_loja, slug, nome, email, senha } = req.body;

    if (!nome_loja || !slug || !nome || !email || !senha) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios: nome_loja, slug, nome, email, senha' });
    }

    // Verificar se slug já existe
    const existente = await query('SELECT id FROM tenants WHERE slug = $1', [slug]);
    if (existente.rows.length > 0) {
      return res.status(409).json({ erro: 'Slug já está em uso' });
    }

    // Criar tenant
    const tenantRes = await query(
      `INSERT INTO tenants (nome, slug, email) VALUES ($1, $2, $3) RETURNING id`,
      [nome_loja, slug, email]
    );
    const tenantId = tenantRes.rows[0].id;

    // Criar usuário admin
    const senhaHash = await bcrypt.hash(senha, 10);
    const userRes = await query(
      `INSERT INTO usuarios (tenant_id, nome, email, senha_hash, role)
       VALUES ($1, $2, $3, $4, 'admin') RETURNING id, nome, email, role`,
      [tenantId, nome, email, senhaHash]
    );

    const usuario = { ...userRes.rows[0], tenant_id: tenantId };
    const token = gerarToken(usuario);

    res.status(201).json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        tenant: { id: tenantId, nome: nome_loja, slug }
      }
    });
  } catch (err) {
    console.error('Erro no registro:', err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

module.exports = router;
