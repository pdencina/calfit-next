'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getConversaciones, getOrCreateConversacion, getMessages, sendMessage, getAlumnos } from '@/lib/supabase/api'

export default function MensajesProfe() {
  const [userId, setUserId]       = useState('')
  const [org, setOrg]             = useState<any>(null)
  const [alumnos, setAlumnos]     = useState<any[]>([])
  const [convos, setConvos]       = useState<any[]>([])
  const [activeConvo, setActive]  = useState<any>(null)
  const [messages, setMessages]   = useState<any[]>([])
  const [newMsg, setNewMsg]       = useState('')
  const [sending, setSending]     = useState(false)
  const [loading, setLoading]     = useState(true)
  const endRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data: o } = await sb.from('organizations').select('*').eq('owner_id', user.id).single()
      setOrg(o)
      const [c, a] = await Promise.all([
        getConversaciones(sb, user.id),
        o ? getAlumnos(sb, o.id) : Promise.resolve([])
      ])
      setConvos(c || [])
      setAlumnos(a || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function openConvo(convo: any) {
    setActive(convo)
    const sb = createClient()
    const msgs = await getMessages(sb, convo.id)
    setMessages(msgs || [])
    if (channelRef.current) channelRef.current.unsubscribe()
    channelRef.current = sb.channel(`conv-${convo.id}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'messages', filter:`conversation_id=eq.${convo.id}` },
        (payload: any) => setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, { ...payload.new, sender: { full_name: '' } }])
      ).subscribe()
  }

  async function startConvo(alumno: any) {
    if (!org) return
    const sb = createClient()
    const convo = await getOrCreateConversacion(sb, org.id, userId, alumno.id)
    const updated = await getConversaciones(sb, userId)
    setConvos(updated || [])
    const found = updated?.find((c: any) => c.id === convo.id)
    if (found) openConvo(found)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMsg.trim() || !activeConvo || sending) return
    setSending(true)
    try {
      const sb  = createClient()
      const msg = await sendMessage(sb, activeConvo.id, userId, newMsg.trim())
      setMessages(prev => [...prev, { ...msg, sender: { full_name: 'Yo' } }])
      setNewMsg('')
      setConvos(prev => prev.map(c => c.id === activeConvo.id ? { ...c, last_message_at: new Date().toISOString() } : c))
    } catch {}
    finally { setSending(false) }
  }

  const init = (n: string) => n?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '??'

  if (loading) return <div className="loader"><div className="spinner"/>Cargando...</div>

  return (
    <div>
      <div className="page-title">MENSAJES</div>
      <div className="page-sub">Chat directo con tus alumnos</div>

      <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:0,border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,overflow:'hidden',height:'calc(100vh - 180px)'}}>

        {/* Panel izquierdo */}
        <div style={{background:'#111',borderRight:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <select onChange={e => { const a = alumnos.find((al: any) => al.id === e.target.value); if(a) startConvo(a); e.target.value='' }}
              style={{width:'100%',background:'#1a1a1a',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'8px 10px',color:'#f0efe8',fontSize:13,outline:'none'}}>
              <option value="">+ Nuevo chat con alumno</option>
              {alumnos.map((a: any) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
          </div>
          <div style={{flex:1,overflowY:'auto'}}>
            {convos.length === 0 && (
              <div style={{padding:24,textAlign:'center',color:'#444',fontSize:13}}>Sin conversaciones</div>
            )}
            {convos.map((c: any) => {
              const other = c.alumno
              const isActive = activeConvo?.id === c.id
              return (
                <div key={c.id} onClick={() => openConvo(c)}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',cursor:'pointer',
                    background:isActive?'rgba(200,245,66,0.05)':'transparent',
                    borderLeft:`2px solid ${isActive?'#c8f542':'transparent'}`,transition:'all 0.15s'}}>
                  <div style={{width:34,height:34,borderRadius:'50%',background:'#c8f542',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#070707',flexShrink:0}}>{init(other?.full_name)}</div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{other?.full_name}</div>
                    <div style={{fontSize:11,color:'#555'}}>{new Date(c.last_message_at).toLocaleDateString('es-CL',{day:'numeric',month:'short'})}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chat */}
        {activeConvo ? (
          <div style={{display:'flex',flexDirection:'column',background:'#0a0a0a'}}>
            <div style={{padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',gap:12,background:'#111'}}>
              <div style={{width:34,height:34,borderRadius:'50%',background:'#c8f542',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#070707'}}>
                {init(activeConvo.alumno?.full_name)}
              </div>
              <div style={{fontSize:14,fontWeight:500}}>{activeConvo.alumno?.full_name}</div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
              {messages.length === 0 && <div style={{textAlign:'center',color:'#444',fontSize:13,marginTop:40}}>Iniciá la conversación 👋</div>}
              {messages.map((m: any) => {
                const isMe = m.sender_id === userId
                return (
                  <div key={m.id} style={{display:'flex',justifyContent:isMe?'flex-end':'flex-start',marginBottom:8}}>
                    <div style={{maxWidth:'70%',padding:'10px 14px',
                      background:isMe?'#c8f542':'#1e1e1e',
                      color:isMe?'#070707':'#f0efe8',
                      borderRadius:isMe?'16px 16px 4px 16px':'16px 16px 16px 4px',
                      fontSize:14,lineHeight:1.5}}>
                      {m.content}
                      <div style={{fontSize:10,opacity:0.5,textAlign:'right',marginTop:4}}>
                        {new Date(m.created_at).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={endRef}/>
            </div>
            <form onSubmit={handleSend} style={{padding:'14px 20px',borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',gap:10}}>
              <input value={newMsg} onChange={e=>setNewMsg(e.target.value)} placeholder="Escribí tu mensaje..."
                style={{flex:1,background:'#1a1a1a',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'10px 14px',color:'#f0efe8',fontSize:14,outline:'none'}}
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){handleSend(e)}}}/>
              <button type="submit" className="btn btn-primary" disabled={!newMsg.trim()||sending} style={{fontSize:15,padding:'10px 18px'}}>
                {sending?'...':'↑'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,color:'#444'}}>
            <div style={{fontSize:36,opacity:0.2}}>💬</div>
            <div style={{fontSize:13}}>Seleccioná un alumno para chatear</div>
          </div>
        )}
      </div>
    </div>
  )
}
