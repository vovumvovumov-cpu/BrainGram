import { useCallback, useEffect, useState } from "react";
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import { Gem, RefreshCw, Wallet } from "lucide-react";

type TonNft = { address: string; metadata?: { name?: string; description?: string; image?: string }; collection?: { name?: string } };
function imageUrl(value?: string) {
  if (!value) return "";
  if (value.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${value.slice(7)}`;
  if (value.startsWith("http://")) return value.replace("http://", "https://");
  return value;
}
export default function NftGifts() {
  const address = useTonAddress();
  const [items, setItems] = useState<TonNft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const loadNfts = useCallback(async () => {
    if (!address) { setItems([]); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch(`https://tonapi.io/v2/accounts/${encodeURIComponent(address)}/nfts?limit=100`);
      if (!response.ok) throw new Error(response.status === 429 ? "Слишком много запросов. Попробуй позже." : "Не удалось загрузить NFT из TON.");
      const data = await response.json() as { nft_items?: TonNft[] };
      setItems(data.nft_items ?? []);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Ошибка загрузки NFT."); }
    finally { setLoading(false); }
  }, [address]);
  useEffect(() => { void loadNfts(); }, [loadNfts]);
  return <section className="bg-nft-page">
    <div className="bg-nft-heading"><div><span className="bg-nft-kicker">BRAINGRAM • TON</span><h2>Мои NFT</h2><p>Коллекционные подарки и NFT в твоём TON-кошельке</p></div><span className="bg-nft-gem"><Gem size={25}/></span></div>
    <div className="bg-nft-wallet"><div className="bg-nft-wallet-icon"><Wallet size={22}/></div><div className="bg-nft-wallet-copy"><strong>{address ? "TON-кошелёк подключён" : "Подключи TON-кошелёк"}</strong><span>{address ? `${address.slice(0, 8)}…${address.slice(-6)}` : "Tonkeeper, MyTonWallet и другие"}</span></div><TonConnectButton /></div>
    {!address ? <div className="bg-nft-empty"><div><Wallet size={30}/></div><strong>Здесь появятся твои подарки</strong><p>Подключи кошелёк, в котором хранятся Telegram-подарки, экспортированные в TON.</p></div> : <>
      <div className="bg-nft-list-head"><strong>Коллекция</strong><button type="button" onClick={() => void loadNfts()} disabled={loading}><RefreshCw size={15}/> Обновить</button></div>
      {loading && <p className="bg-nft-message">Загружаем NFT…</p>}
      {error && <p className="bg-nft-error">{error}</p>}
      {!loading && !error && items.length === 0 && <div className="bg-nft-empty"><div><Gem size={30}/></div><strong>NFT пока не найдены</strong><p>Если подарок ещё находится в Telegram, сначала экспортируй коллекционный подарок в TON-кошелёк.</p></div>}
      <div className="bg-nft-grid">{items.map(item => <article className="bg-nft-card" key={item.address}>{imageUrl(item.metadata?.image) ? <img src={imageUrl(item.metadata?.image)} alt={item.metadata?.name || "NFT"} loading="lazy"/> : <div className="bg-nft-no-image"><Gem size={30}/></div>}<strong>{item.metadata?.name || "NFT-подарок"}</strong><span>{item.collection?.name || "TON collection"}</span></article>)}</div>
    </>}
    <p className="bg-nft-note">BrainGram не получает доступ к секретной фразе. Подписание действий происходит только в твоём кошельке.</p>
  </section>;
}
