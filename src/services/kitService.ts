import { api } from "./api";

export interface KitResponse {
  id: number;
  name: string;
  releaseYear: number;
  kitType: string;
  imgUrl?: string;
}

export const kitService = {
  async findAll(): Promise<KitResponse[]> {
    const response = await api.get("/kits");
    return response.data;
  },

  async findByName(name: string): Promise<KitResponse[]> {
    const response = await api.get(`/kits/search?name=${name}`);
    return response.data;
  },

  async findByType(kitType: string): Promise<KitResponse[]> {
    const response = await api.get(`/kits/search/type/${kitType}`);
    return response.data;
  },

  // NOVOS MÉTODOS DE ANO
  async findByYear(year: number): Promise<KitResponse[]> {
    const response = await api.get(`/kits/search/year/${year}`);
    return response.data;
  },

  async findByYearBetween(startYear: number, endYear: number): Promise<KitResponse[]> {
    const response = await api.get(`/kits/search/year?startYear=${startYear}&endYear=${endYear}`);
    return response.data;
  }
};