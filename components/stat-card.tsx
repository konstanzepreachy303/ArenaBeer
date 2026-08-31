import type { LucideIcon } from "lucide-react";

export function StatCard({title,value,description,icon:Icon,tone="slate"}:{title:string;value:string|number;description?:string;icon?:LucideIcon;tone?:"slate"|"emerald"|"amber"|"rose"}){
 const tones={slate:"bg-slate-100 text-slate-700",emerald:"bg-emerald-50 text-emerald-700",amber:"bg-amber-50 text-amber-700",rose:"bg-rose-50 text-rose-700"};
 return <div className="card p-5 transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-slate-500">{title}</p><strong className="mt-2 block text-3xl font-extrabold tracking-tight text-slate-900">{value}</strong></div>{Icon&&<div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tones[tone]}`}><Icon size={20}/></div>}</div>{description&&<p className="mt-3 text-xs text-slate-500">{description}</p>}</div>
}
