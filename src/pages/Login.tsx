import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true); // Começa o carregamento aqui

    if (!email || !password) {
      setError("Preencha todos os campos.");
      setLoading(false);
      return;
    }

    try {
      const data = await authService.login({ email, password });
      
      // Guarda o token no localStorage do navegador
      localStorage.setItem("@tmao:token", data.token);
      
      // Redireciona o usuário para o Dashboard
      navigate("/dashboard");
    } catch (err: unknown) {
      // Verifica de forma segura se o erro estruturado veio do Axios
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(
          axiosError.response?.data?.message || 
          "Falha na autenticação. Verifique suas credenciais."
        );
      } else {
        setError("Ocorreu um erro inesperado. Tente novamente.");
      }
    } finally {
      setLoading(false); // Garante que o loading desliga ao encerrar a requisição
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">T-mão Ranking</h1>
          <p className="text-zinc-400 mt-2">Faça login para criar seu ranking de camisas do timão</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-950/50 border border-red-800 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
              placeholder="fiel@corinthians.com.br"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-white px-4 py-2 font-semibold text-black hover:bg-zinc-200 transition-colors mt-6 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Não tem uma conta?{' '}
          <Link to="/cadastro" className="font-semibold text-white hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}