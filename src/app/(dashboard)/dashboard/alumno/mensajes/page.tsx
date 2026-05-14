'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getConversaciones, getMessages, sendMessage } from '@/lib/supabase/api'

export default function MensajesAlumno() {
  const [userId, setUserId]     = useState('')
  const [convos, setConvos]     = useState<any[]>([])
  const [active, setActive]     = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg]     = useState('')
  const [sending, setSending]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const endRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const c = await getConversaciones(sb, user.id)
      setConvos(c || [])
      if (c && c.length > 0) openConvo(c[0], user.id, sb)
      setLoading(false)
    })
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function openConvo(convo: any, uid?: string, sbClient?: any) {
    const sb  = sbClient || createClient()
    const me  = uid || userId
    setActive(convo)
    const msgs = await getMessages(sb, convo.id)
    setMessages(msgs || [])
    if (channelRef.current) channelRef.current.unsubscribe()
    channelRef.current = sb.channel(`conv-alumno-${convo.id}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'messages', filter:`conversation_id=eq.${convo.id}` },
        (payload: any) => setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new])
      ).subscribe()
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMsg.trim() || !active || sending) return
    setSending(true)
    try {
      const sb  = createClient()
      const msg = await sendMessage(sb, active.id, userId, newMsg.trim())
      setMessages(prev => [...prev, msg])
      setNewMsg('')
    } catch {}
    finally { setSending(false) }
  }

  const init = (n: string) => n?.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase() || '??'

  if (loading) return <div className="loader"><div className="spinner"/>Cargando...</div>

  if (convos.length === 0) return (
    <div>
      <div className="page-title">MENSAJES</div>
      <div className="empty" style={{marginTop:40}}>
        <div className="empty-icon">💬</div>
        <div className="empty-title">SIN MENSAJES</div>
        <div className="empty-sub">Tu profe aún no inició una conversación contigo</div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="page-title">MENSAJES</div>
      <div className="page-sub">Chat con tu entrenador</div>

      <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:0,border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,overflow:'hidden',height:'calc(100vh - 180px)'}}>

        {/* Conversaciones */}
        <div style={{background:'#111',borderRight:'1px solid rgba(255,255,255,0.06)'}}>
          {convos.map((c: any) => {
            const other = c.profe
            const isAct = active?.id === c.id
            return (
              <div key={c.id} onClick={() => openConvo(c)}
                style={{display:'flex',alignItems:'center',gap:10,padding:'13px 16px',cursor:'pointer',
                  background:isAct?'rgba(200,245,66,0.05)':'transparent',
                  borderLeft:`2px solid ${isAct?'#c8f542':'transparent'}`,transition:'all 0.15s'}}>
                <div style={{width:34,height:34,borderRadius:'50%',background:'#c8f542',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#070707',flexShrink:0}}>{init(other?.full_name)}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:500}}>{other?.full_name}</div>
                  <div style={{fontSize:11,color:'#555'}}>Tu entrenador</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Chat */}
        {active ? (
          <div style={{display:'flex',flexDirection:'column',background:'#0a0a0a'}}>
            <div style={{padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)',background:'#111',display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'#c8f542',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#070707'}}>
                {init(active.profe?.full_name)}
              </div>
              <div style={{fontSize:14,fontWeight:500}}>{active.profe?.full_name}</div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
              {messages.length === 0 && <div style={{textAlign:'center',color:'#444',fontSize:13,marginTop:40}}>Empezá la conversación 👋</div>}
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
              <input value={newMsg} onChange={e=>setNewMsg(e.target.value)}
                placeholder="Escribí tu mensaje..."
                style={{flex:1,background:'#1a1a1a',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'10px 14px',color:'#f0efe8',fontSize:14,outline:'none'}}
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey)handleSend(e)}}/>
              <button type="submit" className="btn btn-primary" disabled={!newMsg.trim()||sending} style={{fontSize:15,padding:'10px 18px'}}>
                {sending?'...':'↑'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',color:'#444',fontSize:13}}>
            Seleccioná una conversación
          </div>
        )}
      </div>
    </div>
  )
}
