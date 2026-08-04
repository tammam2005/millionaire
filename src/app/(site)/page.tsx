import { notFound } from "next/navigation";
import { OutfitFilm } from "@/components/experience/OutfitFilm";
import { TheList } from "@/components/sections/TheList";
import { commerce } from "@/lib/commerce";

/**
 * The home page.
 *
 * One product, one continuous sequence. The wordmark opens alone, dissolves
 * into the garment, and the garment stays on screen through every chapter
 * until it is bought — there is no grid, no collection index and no related
 * products, because there is only one thing to sell.
 */
export default async function HomePage() {
  const set = await commerce.getProduct("millionaire-hooded-set");
  if (!set) notFound();

  return (
    <main className="flex flex-1 flex-col">
      <OutfitFilm product={set} />
      <TheList />
    </main>
  );
}
