// =====================================================================
// controllers/CalendarioEventoController.js - Camada HTTP (Express)
// =====================================================================

import * as CalendarioEventoService from '../services/CalendarioEventoService.js';

// Traduz erros de domínio/validação para os códigos HTTP correspondentes
function tratarErro(res, erro) {
  if (erro instanceof TypeError || erro instanceof RangeError) {
    return res.status(400).json({ erro: erro.message });
  }
  if (erro.message && erro.message.includes('não encontrado')) {
    return res.status(404).json({ erro: erro.message });
  }
  console.error('Erro interno em CalendarioEventoController:', erro);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}

// 1. GET /calendario (com filtro opcional ?status=pendente)
export async function listar(req, res) {
  try {
    const eventos = await CalendarioEventoService.listar({
      status: req.query.status,
    });
    return res.status(200).json(eventos);
  } catch (erro) {
    return tratarErro(res, erro);
  }
}

// 2. GET /calendario/:id
export async function buscarPorId(req, res) {
  try {
    const evento = await CalendarioEventoService.buscarPorId(req.params.id);
    return res.status(200).json(evento);
  } catch (erro) {
    return tratarErro(res, erro);
  }
}

// 3. POST /calendario
export async function criar(req, res) {
  try {
    const criado = await CalendarioEventoService.criar(req.body);
    return res.status(201).json(criado);
  } catch (erro) {
    return tratarErro(res, erro);
  }
}

// 4. PUT / PATCH /calendario/:id
export async function atualizar(req, res) {
  try {
    const atualizado = await CalendarioEventoService.atualizar(req.params.id, req.body);
    return res.status(200).json(atualizado);
  } catch (erro) {
    return tratarErro(res, erro);
  }
}

// 5. DELETE /calendario/:id
export async function excluir(req, res) {
  try {
    await CalendarioEventoService.excluir(req.params.id);
    return res.status(204).end();
  } catch (erro) {
    return tratarErro(res, erro);
  }
}