import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOutIcon, PlusIcon, XIcon, TrophyIcon, Trash2Icon } from "lucide-react"; // Importamos o Trash2Icon
import { rankingService } from "../services/rankingService";
import type { RankingSummaryResponse } from "../services/rankingService";


type RankingTypeOption = "TOP_3" | "TOP_5" | "TOP_10";

export function Dashboard() {
  const navigate = useNavigate();
  
  const [rankings, setRankings] = useState<RankingSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<RankingTypeOption>("TOP_5");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function fetchRankings() {
      try {
        const data = await rankingService.findAll();
        setRankings(data);
      } catch (error) {
        console.error("Erro ao buscar rankings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRankings();
  }, []);

  function handleLogout() {
    localStorage.removeItem("@tmao:token");
    navigate("/login");
  }

  async function handleCreateRanking(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle) return;

    try {
      setCreating(true);
      const created = await rankingService.create({
        title: newTitle,
        rankingType: newType,
      });
      navigate(`/builder/${created.id}`);
    } catch (error) {
      console.error("Erro ao criar ranking:", error);
      alert("Falha ao criar o ranking. Tente novamente.");
    } finally {
      setCreating(false);
    }
  }

  // NOVA FUNÇÃO: Excluir Ranking
  async function handleDeleteRanking(e: React.MouseEvent, id: number) {
    e.stopPropagation(); // Evita que o card navegue para o Builder ao clicar na lixeira
    
    if (!window.confirm("Tem certeza que deseja excluir este ranking para sempre?")) {
      return;
    }

    try {
      await rankingService.delete(id);
      // Remove da tela na mesma hora sem recarregar a página
      setRankings(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error("Erro ao excluir ranking:", error);
      alert("Falha ao excluir. Tente novamente.");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-900 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">T-mão Ranking</h1>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">Olá, Fiel</span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <LogOutIcon size={18} />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Meus Rankings</h2>
            <p className="text-zinc-400 mt-1">Gerencie seus rankings</p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-md bg-white px-4 py-2 font-semibold text-black hover:bg-zinc-200 transition-colors"
          >
            <PlusIcon size={20} />
            Criar Novo Ranking
          </button>
        </div>

        {loading ? (
          <div className="text-center text-zinc-500 py-20">Carregando seus rankings...</div>
        ) : rankings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 py-20 text-center">
            <div className="mb-4 rounded-full bg-zinc-800 p-4">
              <PlusIcon size={32} className="text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-white">Nenhum ranking criado</h3>
            <p className="mt-1 text-sm text-zinc-400 max-w-sm">
              Você ainda não montou nenhuma lista. Clique no botão acima para começar a classificar os mantos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rankings.map((ranking) => (
              <div 
                key={ranking.id}
                onClick={() => navigate(`/builder/${ranking.id}`)}
                className="group cursor-pointer flex flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-500 hover:bg-zinc-800/80 transition-all relative"
              >
                {/* Botão de Excluir posicionado no canto superior direito do card */}
                <button 
                  onClick={(e) => handleDeleteRanking(e, ranking.id)}
                  className="absolute right-4 top-4 hidden rounded-md p-1.5 text-zinc-500 hover:bg-red-950/50 hover:text-red-400 group-hover:block transition-colors"
                  title="Excluir Ranking"
                >
                  <Trash2Icon size={16} />
                </button>

                <div>
                  <div className="mb-3 inline-flex items-center rounded-full bg-zinc-950 px-2.5 py-1 shadow-sm border border-zinc-800">
                    <TrophyIcon size={14} className="text-yellow-500 mr-2" />
                    <span className="text-xs font-medium text-zinc-300">
                      {ranking.rankingType.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-zinc-100 line-clamp-2 pr-8">
                    {ranking.title}
                  </h3>
                </div>
                <div className="mt-4 text-xs text-zinc-500">
                  Clique para editar a montagem
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Criação (inalterado) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Novo Ranking</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateRanking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Título do Ranking</label>
                <input 
                  type="text" 
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Minhas camisas favoritas"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                  disabled={creating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Tamanho do Pódio</label>
                <select 
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as RankingTypeOption)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors cursor-pointer"
                  disabled={creating}
                >
                  <option value="TOP_3">Top 3 Posições</option>
                  <option value="TOP_5">Top 5 Posições</option>
                  <option value="TOP_10">Top 10 Posições</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors" disabled={creating}>Cancelar</button>
                <button type="submit" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors disabled:opacity-50" disabled={creating}>{creating ? "Criando..." : "Criar e Montar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}