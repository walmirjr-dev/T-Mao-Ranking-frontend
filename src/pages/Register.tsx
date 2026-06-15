import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

export function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    if (!name || !email || !password) {
      setError("Preencha todos os campos.");
      setLoading(false);
      return;
    }

    try {
      // Envia os dados idênticos ao UserRequest record do Java
      await authService.register({ name, email, password });
      
      setSuccess(true);
      // Aguarda 2 segundos para o usuário ler a mensagem de sucesso e o joga pro login
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: unknown) {
      // Verifica de forma segura se o erro estruturado veio do Axios
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(
          axiosError.response?.data?.message || 
          "Erro ao criar conta. Verifique os dados ou tente outro e-mail."
        );
      } else {
        setError("Ocorreu um erro inesperado. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Criar Conta</h1>
          <p className="text-zinc-400 mt-2">Junte-se à fiel torcida e crie seus rankings</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-950/50 border border-red-800 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-emerald-950/50 border border-emerald-800 p-3 text-sm text-emerald-200">
            Conta criada com sucesso! Redirecionando para o login...
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Nome</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
              placeholder="Seu nome"
              disabled={loading || success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
              placeholder="fiel@corinthians.com.br"
              disabled={loading || success}
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
              disabled={loading || success}
            />
          </div>

          <button 
            type="submit"
            disabled={loading || success}
            className="w-full rounded-md bg-white px-4 py-2 font-semibold text-black hover:bg-zinc-200 transition-colors mt-6 disabled:opacity-50"
          >
            {loading ? "Criando Conta..." : "Criar Conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-semibold text-white hover:underline">
            Faça Login
          </Link>
        </p>
      </div>
    </div>
  );
}