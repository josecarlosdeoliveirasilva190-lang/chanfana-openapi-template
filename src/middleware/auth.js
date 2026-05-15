// src/middleware/auth.js
// Autenticação JWT e middleware de segurança

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dropship-saas-secret-dev';
const JWT_EXPIRATION = '24h';

// Gerar token JWT
function gerarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      tenant_id: usuario.tenant_id,
      email: usuario.email,
      role: usuario.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
}

// Middleware: verificar token JWT
function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token de autenticação não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    req.tenantId = decoded.tenant_id;
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

// Middleware: verificar role
function autorizar(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.role)) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    next();
  };
}

// Middleware: tenant isolation
function isolarTenant(req, res, next) {
  if (!req.tenantId) {
    return res.status(400).json({ erro: 'Tenant não identificado' });
  }
  next();
}

module.exports = { gerarToken, autenticar, autorizar, isolarTenant };
