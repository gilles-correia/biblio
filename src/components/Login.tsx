import React, { useState } from 'react';
import { api } from '../services/api';

interface LoginProps {
  onLoginSuccess: (token: string, usuario: any) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'ALUNO' | 'PROFESSOR'>('ALUNO');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      if (isRegister) {
        // Fluxo de Cadastro
        await api.post('/usuarios', { nome, email, password, tipo });
        alert('Cadastro realizado com sucesso! Faça login para continuar.');
        setIsRegister(false);
        setPassword('');
      } else {
        // Fluxo de Autenticação / Signin
        const response = await api.post('/login-biblio', { email, password });
        const { token, name, email: userEmail, adm, empresa } = response.data;

        // Armazena o JWT no localStorage para o api.ts utilizar
        localStorage.setItem('@Biblioteca:token', token);

        // Notifica o App.tsx que o login foi efetuado
        onLoginSuccess(token, { name, email: userEmail, adm, empresa });
      }
    } catch (err: any) {
      setErro(err.response?.data?.error || err.response?.data || 'Erro de autenticação. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg shadow-blue-500/30">
            <i className="fa-solid fa-book-bookmark"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Biblioteca Escolar</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isRegister ? 'Crie sua conta para acessar o sistema' : 'Informe suas credenciais para entrar'}
          </p>
        </div>

        {erro && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Perfil</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as 'ALUNO' | 'PROFESSOR')}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="ALUNO">Aluno</option>
                <option value="PROFESSOR">Professor</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all text-sm"
          >
            {loading ? 'Aguarde...' : isRegister ? 'Cadastrar' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="mt-6 text-center pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            {isRegister ? 'Já possui uma conta?' : 'Ainda não tem cadastro?'}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErro('');
              }}
              className="ml-1 text-blue-600 font-bold hover:underline"
            >
              {isRegister ? 'Fazer Login' : 'Cadastre-se'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}