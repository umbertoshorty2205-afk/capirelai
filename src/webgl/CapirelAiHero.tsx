import React, { useState } from 'react';
import { AxonCanvas } from './AxonCanvas';
import { OnePageSections } from '../components/OnePageSections';
import { ChiSonoModal } from '../components/ChiSonoModal';
import { ArticleReaderModal, FullArticleData } from '../components/ArticleReaderModal';

export default function CapirelAiHero() {
  const [isChiSonoOpen, setIsChiSonoOpen] = useState(false);
  const [activeArticle, setActiveArticle] = useState<FullArticleData | null>(null);

  return (
    <div className="relative w-full min-h-screen bg-black selection:bg-[#38bdf8] selection:text-black">
      {/* Sfondo 3D WebGL Fisso */}
      <AxonCanvas />

      {/* Esperienza One-Page scrollabile con tutte le sezioni, 12 articoli e Forum */}
      <OnePageSections
        onOpenChiSono={() => setIsChiSonoOpen(true)}
        onReadArticle={(art) => setActiveArticle(art)}
      />

      {/* Modale Chi Sono con il testo esatto dell'autore */}
      <ChiSonoModal
        isOpen={isChiSonoOpen}
        onClose={() => setIsChiSonoOpen(false)}
      />

      {/* Lettore Articoli Integrato In-Place */}
      <ArticleReaderModal
        article={activeArticle}
        onClose={() => setActiveArticle(null)}
      />
    </div>
  );
}
