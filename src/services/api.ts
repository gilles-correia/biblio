import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://gille3470.c35.integrator.host',
});

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: 'ALUNO' | 'PROFESSOR';
  ativo: boolean;
}

export interface Livro {
  id: number;
  titulo: string;
  autor: string;
  isbn: string;
  quantidade_disponivel: number;
}

export interface Emprestimo {
  id: number;
  usuario_nome: string;
  usuario_tipo: string;
  livro_titulo: string;
  data_emprestimo: string;
  data_prevista_devolucao: string;
  data_devolucao: string | null;
  status: 'EMPRESTADO' | 'DEVOLVIDO' | 'ATRASADO';
}