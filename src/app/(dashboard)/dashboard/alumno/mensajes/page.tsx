'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Conversation = { id: number; org_id: number; profe_id: string; alumno_id: string; last_message_at: string }
type Message = { id: number; conversation_id: number; sender_id: string; content: string; created_at: string }
type Profile = { id: string; full_name: string; email: string }

export default function AlumnoMensajesPage() {
  const supabase = useMemo(() => createClient(), [])
  const [userId, setUserId] = useState('')
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [coach, setCoach] = useState<Profile | null>(null)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true); setError('')
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) { setError('Sesión no encontrada'); setLoading(false); return }
    setUserId(uid)

    const { data: conv } = await supabase.from('conversations').select('*').eq('alumno_id', uid).order('last_message_at', { ascending: false }).limit(1).maybeSingle()
    if (!conv) { setLoading(false); return }
    setConversation(conv as Conversation)

    const { data: prof } = await supabase.from('profiles').select('id,full_name,email').eq('id', conv.profe_id).maybeSingle()
    setCoach((prof as Profile) || null)
    await loadMessages(conv.id)
    setLoading(false)
  }

  async function loadMessages(conversationId: number) {
    const { data, error: msgError } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at')
    if (msgError) setError(msgError.message)
    else setMessages((data || []) as Message[])
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!conversation || !content.trim()) return
    const text = content.trim()
    setContent('')
    const { error: sendError } = await supabase.from('messages').insert({ conversation_id: conversation.id, sender_id: userId, content: text })
    if (sendError) { setError(sendError.message); setContent(text) }
    else await loadMessages(conversation.id)
  }

  if (loading) return <div className="loader">Cargando mensajes...</div>

  return (
    <div>
      <div className="page-title">MENSAJES</div>
      <div className="page-sub">Comunicación con tu profesor.</div>
      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {!conversation ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: '#444' }}>Aún no tienes una conversación activa. Tu profesor puede iniciarla desde su panel.</div>
      ) : (
        <div className="card" style={{ minHeight: 620, display: 'flex', flexDirection: 'column' }}>
          <div style={{ paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'Bebas Neue', letterSpacing: 2, fontSize: 28 }}>{coach?.full_name || 'Profesor'}</div>
            <div style={{ color: '#666', fontSize: 12 }}>{coach?.email}</div>
          </div>
          <div style={{ flex: 1, padding: '18px 0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map(m => {
              const own = m.sender_id === userId
              return <div key={m.id} style={{ alignSelf: own ? 'flex-end' : 'flex-start', maxWidth: '72%' }}>
                <div style={{ background: own ? '#c8f542' : '#222', color: own ? '#070707' : '#f0efe8', padding: '10px 14px', borderRadius: 14, fontSize: 14 }}>{m.content}</div>
                <div style={{ color: '#555', fontSize: 10, marginTop: 4, textAlign: own ? 'right' : 'left' }}>{new Date(m.created_at).toLocaleString()}</div>
              </div>
            })}
            {!messages.length && <div style={{ color: '#555', textAlign: 'center', marginTop: 80 }}>Sin mensajes aún.</div>}
          </div>
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: 10, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
            <input value={content} onChange={e => setContent(e.target.value)} placeholder="Escribe un mensaje..." style={field} />
            <button className="btn btn-primary">ENVIAR</button>
          </form>
        </div>
      )}
    </div>
  )
}

const field: React.CSSProperties = { width: '100%', padding: '10px 12px', background: '#222', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f0efe8', outline: 'none' }
