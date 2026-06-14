import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SearchIcon, SaveIcon, ImageIcon, FilterIcon, XIcon, FilterXIcon, ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { toPng } from 'html-to-image';
import { kitService } from "../services/kitService";
import { rankingService } from "../services/rankingService";
import type { DragEndEvent } from "@dnd-kit/core";
import type { KitResponse } from "../services/kitService";
import type { RankingDetailResponse } from "../services/rankingService";

interface Slot {
  position: number;
  kit: KitResponse | null;
}

type FilterMode = "ALL" | "NAME" | "TYPE" | "YEAR" | "BETWEEN_YEARS";

function getPositionColor(pos: number) {
  if (pos === 1) return "text-yellow-400";
  if (pos === 2) return "text-zinc-300";
  if (pos === 3) return "text-orange-500";
  return "text-white";
}

function DraggableKitCard({ kit }: { kit: KitResponse }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `kit-${kit.id}`,
    data: kit,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform), zIndex: 50 } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex cursor-grab items-center gap-4 rounded-lg border border-zinc-700 bg-zinc-900/80 p-3 shadow-sm hover:border-zinc-500 active:cursor-grabbing"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-md border border-zinc-700 bg-zinc-950 text-xs text-zinc-500 overflow-hidden">
        {kit.imgUrl ? <img src={kit.imgUrl} alt={kit.name} loading="lazy" className="object-cover h-full w-full" /> : "Foto"}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-zinc-100">{kit.name}</h4>
        <div className="flex justify-between text-sm text-zinc-400">
          <span>{kit.kitType}</span>
          <span>{kit.releaseYear}</span>
        </div>
      </div>
    </div>
  );
}

function DroppableSlot({ slot, removeKit }: { slot: Slot, removeKit: (pos: number) => void }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${slot.position}`,
    data: { position: slot.position },
  });

  const colorClass = getPositionColor(slot.position);

  return (
    <div className="flex items-center gap-4">
      <span className={`text-2xl font-bold ${colorClass} w-8 text-right`}>{slot.position}º</span>
      <div
        ref={setNodeRef}
        className={`flex min-h-[88px] flex-1 items-center rounded-lg border-2 border-dashed p-2 transition-colors ${
          isOver ? "border-white bg-zinc-800" : "border-zinc-700 bg-zinc-900/30"
        }`}
      >
        {slot.kit ? (
          <div className="flex w-full items-center gap-4 rounded-md border border-zinc-700 bg-zinc-900 p-2 shadow-sm relative group">
            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-zinc-950 overflow-hidden">
              {slot.kit.imgUrl ? <img src={slot.kit.imgUrl} alt={slot.kit.name} loading="lazy" className="object-cover h-full w-full" /> : <span className="text-[10px] text-zinc-600">Foto</span>}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-zinc-100">{slot.kit.kitType === 'SPECIAL' ? `🌟 ${slot.kit.name}` : slot.kit.name}</h4>
              <p className="text-xs text-zinc-400">{slot.kit.kitType} • {slot.kit.releaseYear}</p>
            </div>
            <button
              onClick={() => removeKit(slot.position)}
              className="absolute right-2 top-2 hidden rounded-full bg-red-900/80 p-1 text-white hover:bg-red-700 group-hover:block"
            >
              ✕
            </button>
          </div>
        ) : (
          <span className="w-full text-center text-sm text-zinc-500">Arraste uma camisa aqui</span>
        )}
      </div>
    </div>
  );
}

export function RankingBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ranking, setRanking] = useState<RankingDetailResponse | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);

  const [availableKits, setAvailableKits] = useState<KitResponse[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [modalFilterMode, setModalFilterMode] = useState<"TYPE" | "YEAR" | "BETWEEN_YEARS">("TYPE");
  const [typeValue, setTypeValue] = useState("HOME");
  const [yearValue, setYearValue] = useState("");
  const [startYearValue, setStartYearValue] = useState("");
  const [endYearValue, setEndYearValue] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const podiumRef = useRef<HTMLDivElement>(null);
  const [podiumHeight, setPodiumHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const rankingId = id ? Number(id) : 1;
    rankingService.findById(rankingId)
      .then(data => {
        setRanking(data);
        const size = data.rankingType === 'TOP_10' ? 10 : data.rankingType === 'TOP_5' ? 5 : 3;
        const initialSlots: Slot[] = Array.from({ length: size }, (_, i) => ({
          position: i + 1,
          kit: data.kitRankings.find(kr => kr.position === i + 1)?.kit || null
        }));
        setSlots(initialSlots);
      })
      .catch(err => console.error("Erro ao carregar ranking", err));
  }, [id]);

  useEffect(() => {
    if (podiumRef.current) {
      setPodiumHeight(podiumRef.current.offsetHeight);
    }
  }, [slots]);

  useEffect(() => {
    const fetchKits = async () => {
      try {
        let results: KitResponse[] = [];
        if (filterMode === "NAME" && searchTerm) {
          results = await kitService.findByName(searchTerm);
        } else if (filterMode === "TYPE" && typeValue) {
          results = await kitService.findByType(typeValue);
        } else if (filterMode === "YEAR" && yearValue) {
          results = await kitService.findByYear(Number(yearValue));
        } else if (filterMode === "BETWEEN_YEARS" && startYearValue && endYearValue) {
          results = await kitService.findByYearBetween(Number(startYearValue), Number(endYearValue));
        } else {
          results = await kitService.findAll();
        }
        setAvailableKits(results);
      } catch (err) {
        console.error("Erro ao buscar kits", err);
      }
    };

    const delayDebounceFn = setTimeout(() => { fetchKits(); }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [filterMode, searchTerm, typeValue, yearValue, startYearValue, endYearValue]);

  function handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    setSearchTerm(text);
    if (text) {
      setFilterMode("NAME");
    } else {
      setFilterMode("ALL");
    }
  }

  function handleApplyAdvancedFilter(e: React.FormEvent) {
    e.preventDefault();
    setSearchTerm("");
    setFilterMode(modalFilterMode);
    setIsFilterModalOpen(false);
  }

  function handleClearFilters() {
    setSearchTerm("");
    setFilterMode("ALL");
    setIsFilterModalOpen(false);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const kitDragged = active.data.current as KitResponse;
    const targetPosition = over.data.current?.position as number;

    setSlots((prevSlots) =>
      prevSlots.map((slot) => {
        if (slot.kit?.id === kitDragged.id && slot.position !== targetPosition) {
          return { ...slot, kit: null };
        }
        if (slot.position === targetPosition) {
          return { ...slot, kit: kitDragged };
        }
        return slot;
      })
    );
  }

  function removeKitFromSlot(position: number) {
    setSlots(slots.map(s => s.position === position ? { ...s, kit: null } : s));
  }

  async function handleSaveRanking() {
    if (!ranking) return;

    setIsSaving(true);
    try {
      for (const kitRanking of ranking.kitRankings) {
        await rankingService.removeKitFromRanking(ranking.id, kitRanking.kit.id);
      }

      for (const slot of slots) {
        if (slot.kit) {
          await rankingService.addKitToRanking(ranking.id, slot.kit.id, slot.position);
        }
      }

      navigate('/dashboard');
    } catch (error) {
      console.error("Erro ao sincronizar ranking com o banco:", error);
      alert("Falha ao salvar. Verifique se não há posições ou camisas duplicadas.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return '';
    }
  }

  async function exportAsImage() {
    setIsExporting(true);
    try {
      const element = document.getElementById("ranking-podium");
      if (!element) return;

      const images = element.querySelectorAll('img');
      const originals: string[] = [];

      for (const img of Array.from(images)) {
        originals.push(img.src);
        if (img.src) {
          img.src = await toBase64(img.src);
        }
      }

      const dataUrl = await toPng(element, {
        backgroundColor: "#09090b",
        cacheBust: true,
        height: element.scrollHeight,
        width: element.offsetWidth,
      });

      Array.from(images).forEach((img, i) => {
        img.src = originals[i];
      });

      const link = document.createElement("a");
      link.download = `tmao-ranking-${ranking?.title || 'export'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Erro ao gerar a imagem:", error);
      alert("Erro ao exportar a imagem. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  }

  if (!ranking) return (
    <div className="p-8 text-center text-white flex justify-center items-center h-screen">
      <Loader2Icon className="animate-spin text-zinc-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 p-6 relative">
      <div className="mx-auto max-w-6xl">

        <button
          onClick={() => navigate('/dashboard')}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon size={16} />
          Voltar para o Dashboard
        </button>

        <div className="mb-12 flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">{ranking.title}</h1>
          <span className="mt-2 rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
            {ranking.rankingType.replace('_', ' ')}
          </span>
        </div>

        <DndContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">

            <div ref={podiumRef} id="ranking-podium" className="flex flex-col gap-4 rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-lg">
              <h2 className="mb-4 text-center text-xl font-bold text-white">Posições</h2>
              <div className="flex flex-col gap-4">
                {slots.map((slot) => (
                  <DroppableSlot key={slot.position} slot={slot} removeKit={removeKitFromSlot} />
                ))}
              </div>
            </div>

            <div
              className="flex flex-col rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-lg"
              style={{ maxHeight: podiumHeight ? `${podiumHeight}px` : undefined }}
            >
              <h2 className="mb-4 text-center text-xl font-bold text-white">Kits</h2>

              <div className="mb-6 flex gap-2">
                <div className="flex flex-1 items-center rounded-md border border-zinc-700 bg-zinc-950 px-3 focus-within:border-white transition-colors">
                  <SearchIcon size={18} className="text-zinc-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchInput}
                    placeholder="buscar manto..."
                    className="w-full bg-transparent px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => setIsFilterModalOpen(true)}
                  className={`flex items-center justify-center rounded-md border px-4 transition-colors ${
                    filterMode !== "ALL" && filterMode !== "NAME"
                      ? "border-white bg-zinc-800 text-white"
                      : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:bg-zinc-800"
                  }`}
                  title="Filtros Avançados"
                >
                  <FilterIcon size={20} />
                </button>

                {filterMode !== "ALL" && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center justify-center rounded-md border border-red-900 bg-red-950/30 px-3 text-red-400 hover:bg-red-900 transition-colors"
                    title="Limpar Filtros"
                  >
                    <FilterXIcon size={18} />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
                {availableKits.length === 0 ? (
                  <p className="text-center text-zinc-500 mt-10">Nenhum kit encontrado.</p>
                ) : (
                  availableKits.map((kit) => (
                    <DraggableKitCard key={kit.id} kit={kit} />
                  ))
                )}
              </div>
            </div>

          </div>
        </DndContext>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <button
            onClick={handleSaveRanking}
            disabled={isSaving || isExporting}
            className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 py-4 font-semibold text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2Icon size={20} className="animate-spin" /> : <SaveIcon size={20} />}
            {isSaving ? "Salvando..." : "Salvar ranking"}
          </button>

          <button
            onClick={exportAsImage}
            disabled={isSaving || isExporting}
            className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 py-4 font-semibold text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2Icon size={20} className="animate-spin" /> : <ImageIcon size={20} />}
            {isExporting ? "Gerando imagem..." : "Salvar como imagem"}
          </button>
        </div>

      </div>

      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Filtros Avançados</h3>
              <button onClick={() => setIsFilterModalOpen(false)} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleApplyAdvancedFilter} className="space-y-5">

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Filtrar por</label>
                <div className="flex rounded-md bg-zinc-950 p-1 border border-zinc-700">
                  <button type="button" onClick={() => setModalFilterMode("TYPE")} className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition-colors ${modalFilterMode === "TYPE" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Tipo</button>
                  <button type="button" onClick={() => setModalFilterMode("YEAR")} className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition-colors ${modalFilterMode === "YEAR" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Ano Específico</button>
                  <button type="button" onClick={() => setModalFilterMode("BETWEEN_YEARS")} className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition-colors ${modalFilterMode === "BETWEEN_YEARS" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Período</button>
                </div>
              </div>

              <div className="min-h-[80px]">
                {modalFilterMode === "TYPE" && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Categoria do Kit</label>
                    <select value={typeValue} onChange={(e) => setTypeValue(e.target.value)} className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white cursor-pointer">
                      <option value="HOME">Home</option>
                      <option value="AWAY">Away</option>
                      <option value="SPECIAL">Special</option>
                    </select>
                  </div>
                )}

                {modalFilterMode === "YEAR" && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Ano de Lançamento</label>
                    <input type="number" required placeholder="Ex: 2012" value={yearValue} onChange={(e) => setYearValue(e.target.value)} className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white" />
                  </div>
                )}

                {modalFilterMode === "BETWEEN_YEARS" && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Ano Inicial</label>
                      <input type="number" required placeholder="Ex: 1990" value={startYearValue} onChange={(e) => setStartYearValue(e.target.value)} className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white" />
                    </div>
                    <span className="text-zinc-500 mt-5">até</span>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Ano Final</label>
                      <input type="number" required placeholder="Ex: 2026" value={endYearValue} onChange={(e) => setEndYearValue(e.target.value)} className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white" />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button type="button" onClick={handleClearFilters} className="rounded-md px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">Limpar Filtros</button>
                <button type="submit" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors">Aplicar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}