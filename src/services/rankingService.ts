import { api } from "./api";
import type { KitResponse } from "./kitService";

// Tipagem para a CRIAÇÃO do Ranking
export interface RankingRequest {
  title: string;
  rankingType: "TOP_3" | "TOP_5" | "TOP_10";
}

// Tipagem para a LISTAGEM no Dashboard
export interface RankingSummaryResponse {
  id: number;
  title: string;
  rankingType: string;
  createdAt: string;
}

// Tipagem para os DETALHES na Mesa de Montagem
export interface RankingDetailResponse {
  id: number;
  title: string;
  rankingType: "TOP_3" | "TOP_5" | "TOP_10";
  kitRankings: {
    kit: KitResponse;
    position: number;
  }[];
}

export const rankingService = {
  // Busca todos os rankings do usuário logado
  async findAll(): Promise<RankingSummaryResponse[]> {
    const response = await api.get("/rankings");
    return response.data;
  },

  // Cria um novo ranking
  async create(data: RankingRequest): Promise<RankingSummaryResponse> {
    const response = await api.post("/rankings", data);
    return response.data;
  },

  // Busca os detalhes de um ranking específico (para o Builder)
  async findById(id: number): Promise<RankingDetailResponse> {
    const response = await api.get(`/rankings/${id}`);
    return response.data;
  },
  
  async addKitToRanking(rankingId: number, kitId: number, position: number) {
    const response = await api.post(`/rankings/${rankingId}/kits`, { kitId, position });
    return response.data;
  },

  async removeKitFromRanking(rankingId: number, kitId: number) {
    const response = await api.delete(`/rankings/${rankingId}/kits/${kitId}`);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/rankings/${id}`);
  },
};