import { getCollectionSnapshot } from "@/lib/football/collection-service";

export const dynamic = "force-dynamic";

export default async function TestDataPage() {
  let snapshot = null;
  let error = "";
  try {
    snapshot = await getCollectionSnapshot();
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  }

  return (
    <main className="min-h-screen bg-[#0F172A] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold tracking-[0.2em] text-blue-400">ATHENA DATA PROVIDER</p>
        <h1 className="mt-2 text-3xl font-bold">Supabase 数据采集验证</h1>
        <p className="mt-2 text-sm text-slate-400">当前页面仅展示数据库中的足球采集结果，不调用真实足球 API。</p>
        {error && <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">读取失败：{error}</p>}
        {!snapshot && !error && <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">Supabase 尚未配置。</p>}
        {snapshot && <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(snapshot.counts).map(([name, count]) => <div key={name} className="rounded-xl border border-slate-700 bg-[#111827] p-4"><p className="text-xs text-slate-500">{name}</p><p className="mt-1 text-2xl font-bold text-blue-300">{count}</p></div>)}</div>
          <pre className="mt-6 overflow-x-auto rounded-2xl border border-slate-700 bg-[#111827] p-4 text-xs leading-6 text-slate-300">{JSON.stringify(snapshot, null, 2)}</pre>
        </>}
      </div>
    </main>
  );
}
