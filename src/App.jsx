import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, Package2, ClipboardList, ArrowRight, RefreshCcw, AlertTriangle, ShoppingCart, Search, Check, Trash2 } from "lucide-react";
import { db } from "./firebase";
import {
  collection, addDoc, updateDoc, doc, onSnapshot, serverTimestamp, query, orderBy
} from "firebase/firestore";

const units = ["botella","ml","lt","unidad","kg","g"];
const categories = ["Destilados","Vinos","Cervezas","Mixers","No alcohol","Otros"];

function statusBadge(stock, min, ideal){
  if (stock <= min) return <span className="badge crit">Crítico</span>;
  if (stock < ideal) return <span className="badge low">Bajo</span>;
  return <span className="badge ok">OK</span>;
}

function NewProductForm(){
  const [form, setForm] = useState({
    name: "", category: "Destilados", supplier: "", unit: "botella",
    barcode: "", stock: 0, stockMin: 1, stockIdeal: 6, cost: 0
  });
  const canSave = form.name && form.supplier && form.stockMin >= 0 && form.stockIdeal >= 0;

  const onSubmit = async (e)=>{
    e.preventDefault();
    await addDoc(collection(db,"products"), {
      ...form,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    });
    setForm({ name: "", category: "Destilados", supplier: "", unit: "botella",
      barcode: "", stock: 0, stockMin: 1, stockIdeal: 6, cost: 0 });
  };

  return (
    <div className="card">
      <h3 className="h3" style={{margin:"0 0 8px 0", fontWeight:700}}>
        <span className="flex"><Package2 size={18}/> Nuevo producto</span>
      </h3>
      <form onSubmit={onSubmit} className="grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
        <div style={{gridColumn:'1 / -1'}}>
          <label className="label">Nombre</label>
          <input className="input" placeholder="Gin Beefeater" value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))}/>
        </div>
        <div>
          <label className="label">Categoría</label>
          <select className="select" value={form.category} onChange={e=>setForm(v=>({...v,category:e.target.value}))}>
            {categories.map(c=>(<option key={c}>{c}</option>))}
          </select>
        </div>
        <div>
          <label className="label">Proveedor</label>
          <input className="input" value={form.supplier} onChange={e=>setForm(v=>({...v,supplier:e.target.value}))}/>
        </div>
        <div>
          <label className="label">Unidad</label>
          <select className="select" value={form.unit} onChange={e=>setForm(v=>({...v,unit:e.target.value}))}>
            {units.map(u=>(<option key={u}>{u}</option>))}
          </select>
        </div>
        <div>
          <label className="label">Código/Barra (opcional)</label>
          <input className="input" value={form.barcode} onChange={e=>setForm(v=>({...v,barcode:e.target.value}))}/>
        </div>
        <div>
          <label className="label">Stock actual</label>
          <input type="number" className="input" value={form.stock} onChange={e=>setForm(v=>({...v,stock:Number(e.target.value)}))}/>
        </div>
        <div>
          <label className="label">Stock mínimo</label>
          <input type="number" className="input" value={form.stockMin} onChange={e=>setForm(v=>({...v,stockMin:Number(e.target.value)}))}/>
        </div>
        <div>
          <label className="label">Stock ideal</label>
          <input type="number" className="input" value={form.stockIdeal} onChange={e=>setForm(v=>({...v,stockIdeal:Number(e.target.value)}))}/>
        </div>
        <div>
          <label className="label">Costo unitario ($)</label>
          <input type="number" className="input" value={form.cost} onChange={e=>setForm(v=>({...v,cost:Number(e.target.value)}))}/>
        </div>
        <div style={{gridColumn:'1 / -1', marginTop:6}}>
          <button className="btn" disabled={!canSave}><Check size={16}/>Guardar</button>
        </div>
      </form>
    </div>
  );
}

function QuickAdjust({p}){
  const [qty,setQty]=useState(1);
  const change = async (delta, note="ajuste rápido")=>{
    const ref = doc(db,"products",p.id);
    await updateDoc(ref,{ stock: (p.stock||0)+delta, updatedAt: serverTimestamp() });
    await addDoc(collection(db,"movements"),{
      productId: p.id, type: delta>0? "in":"out", qty: Math.abs(delta), note, at: serverTimestamp()
    });
  };
  return (
    <div className="controls">
      <button className="iconbtn" title="-1" onClick={()=>change(-1)}><Minus size={16}/></button>
      <button className="iconbtn" title="+1" onClick={()=>change(+1)}><Plus size={16}/></button>
      <input className="input" type="number" style={{width:70}} value={qty} onChange={e=>setQty(Number(e.target.value))}/>
      <button className="iconbtn" title={`-${qty}`} onClick={()=>change(-qty)}><Minus size={16}/></button>
      <button className="iconbtn" title={`+${qty}`} onClick={()=>change(+qty)}><Plus size={16}/></button>
    </div>
  )
}

function OrderDraft({ itemsBySupplier }){
  const waText = (supplier, items)=>{
    const header = encodeURIComponent(`Hola ${supplier||""}! Quisiera pedir:`);
    const lines = items.map(i=>`• ${i.name} — ${i.missing} ${i.unit}`).join("%0A");
    return `https://wa.me/?text=${header}%0A${lines}`;
  };
  return (
    <div className="grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
      {[...itemsBySupplier.entries()].map(([sup,items])=>(
        <div key={sup||'sin'} className="card">
          <div className="flex" style={{justifyContent:'space-between'}}>
            <div>
              <div className="label">Proveedor</div>
              <div style={{fontWeight:600}}>{sup || "(sin proveedor)"}</div>
            </div>
            <a className="btn" href={waText(sup,items)} target="_blank" rel="noreferrer"><ShoppingCart size={16}/>Enviar pedido</a>
          </div>
          <ul style={{marginTop:10}}>
            {items.map(i=>(<li key={i.id}>{i.name} — <b>{i.missing}</b> {i.unit}</li>))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default function App(){
  const [products,setProducts] = useState([]);
  const [qText,setQText] = useState("");
  const [category,setCategory] = useState("Todos");
  const [showOrders,setShowOrders]=useState(false);

  useEffect(()=>{
    const q = query(collection(db,"products"), orderBy("name"));
    const unsub = onSnapshot(q, snap=>{
      setProducts(snap.docs.map(d=>({id:d.id, ...d.data()})));
    });
    return ()=>unsub();
  },[]);

  const filtered = useMemo(()=> products.filter(p=> 
      (category==="Todos" || p.category===category) &&
      (`${p.name} ${p.supplier} ${p.barcode}`.toLowerCase().includes(qText.toLowerCase()))
  ),[products,category,qText]);

  const lowItems = useMemo(()=> filtered.filter(p=> (p.stock||0) <= (p.stockMin||0) ),[filtered]);
  const needsReorder = useMemo(()=> filtered.filter(p=> (p.stock||0) < (p.stockIdeal||0) ),[filtered]);

  const itemsBySupplier = useMemo(()=>{
    const map = new Map();
    for(const p of products){
      const missing = Math.max(0,(p.stockIdeal||0)-(p.stock||0));
      if(missing>0){
        const key = p.supplier || "";
        if(!map.has(key)) map.set(key,[]);
        map.get(key).push({id:p.id,name:p.name,missing,unit:p.unit});
      }
    }
    return map;
  },[products]);

  const removeProduct = async (id)=>{
    if(!confirm("¿Eliminar este producto?")) return;
    await updateDoc(doc(db,"products",id),{isActive:false});
  };

  return (
    <div>
      <div className="header">
        <div className="container">
          <div className="brand">
            <img src="/logo-isabella.jpg" alt="Isabella logo"/>
            <div>
              <div className="h1" style={{display:'flex', alignItems:'center', gap:8}}>
                <span>Isabella · Inventario de Barra</span>
              </div>
              <p className="subtitle">Control de existencias, alertas y pedidos automáticos</p>
            </div>
          </div>

          {/* 🔧 FIX: style eliminado */}
          <div className="searchbar">
            <div className="flex" style={{gap:8, alignItems:'center'}}>
              <Search size={16} color="#6b7280"/>
              <input className="input" placeholder="Buscar por nombre, proveedor o código" value={qText} onChange={e=>setQText(e.target.value)} style={{minWidth:260}}/>
            </div>
            <select className="select small" value={category} onChange={e=>setCategory(e.target.value)}>
              <option>Todos</option>
              {categories.map(c=>(<option key={c}>{c}</option>))}
            </select>
            <button className="btn" onClick={()=>setShowOrders(s=>!s)}>{showOrders? "Ver Inventario":"Ver Pedidos"} <ArrowRight size={16}/></button>
          </div>
        </div>
      </div>

      <div className="container" style={{paddingTop:16}}>
        <div className="row">
          <NewProductForm/>

          <div className="card">
            <div className="flex" style={{justifyContent:'space-between', marginBottom:8}}>
              <h3 style={{margin:0, fontWeight:700}}><span className="flex"><ClipboardList size={18}/> Inventario</span></h3>
              <div className="flex">
                <button className="iconbtn" title="Ver pedidos" onClick={()=>setShowOrders(s=>!s)}><ShoppingCart size={18}/></button>
              </div>
            </div>

            {!showOrders ? (
              <div style={{overflowX:'auto'}}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cat.</th>
                      <th>Prov.</th>
                      <th className="right">Stock</th>
                      <th className="right">Min</th>
                      <th className="right">Ideal</th>
                      <th>Unidad</th>
                      <th className="right">Ajuste</th>
                      <th className="right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p=>(
                      <tr key={p.id}>
                        <td>
                          <div className="flex">
                            {statusBadge(p.stock||0, p.stockMin||0, p.stockIdeal||0)}
                            <div>
                              <div style={{fontWeight:600}}>{p.name}</div>
                              <div className="label">{p.barcode||""}</div>
                            </div>
                          </div>
                        </td>
                        <td>{p.category}</td>
                        <td>{p.supplier}</td>
                        <td className="right"><b>{p.stock||0}</b></td>
                        <td className="right">{p.stockMin||0}</td>
                        <td className="right">{p.stockIdeal||0}</td>
                        <td>{p.unit}</td>
                        <td className="right"><QuickAdjust p={p}/></td>
                        <td className="right">
                          <button className="iconbtn" title="Eliminar" onClick={()=>removeProduct(p.id)}><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length===0 && (
                  <div style={{textAlign:'center', color:'var(--muted)', padding:'24px 0'}}>
                    Sin productos. Agrega el primero a la izquierda.
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="notice"><AlertTriangle size={16}/> Se muestran productos con faltantes respecto al stock ideal.</div>
                <div style={{marginTop:12}}>
                  <OrderDraft itemsBySupplier={itemsBySupplier}/>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{marginTop:12}}>
          <div className="kpis">
            <div className="kpi"><p className="label">Críticos (≤ mín.)</p><div className="value">{lowItems.length}</div></div>
            <div className="kpi"><p className="label">Con faltante</p><div className="value">{needsReorder.length}</div></div>
            <div className="kpi"><p className="label">Productos activos</p><div className="value">{products.length}</div></div>
            <div className="kpi"><p className="label">Última actualización</p><div className="value">{new Date().toLocaleTimeString()}</div></div>
          </div>
        </div>

        <div style={{textAlign:'center', color:'var(--muted)', fontSize:12, padding:'18px 0'}}>
          <span className="flex" style={{justifyContent:'center', gap:6, alignItems:'center'}}>
            <RefreshCcw size={14}/> Datos en tiempo real con Firebase · Prototipo
          </span>
        </div>
      </div>
    </div>
  )
}
