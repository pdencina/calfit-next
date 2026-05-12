'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string
  full_name: string
  email: string
  role: string
}

type Conversation = {
  id: number
  org_id: number
  profe_id: string
  alumno_id: string
  last_message_at: string
}

type Message = {
  id: number
  conversation_id: number
  sender_id: string
  content: string
  created_at: string
}

export default function ProfeMensajesPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  )

  const bottomRef =
    useRef<HTMLDivElement | null>(null)

  const [userId, setUserId] =
    useState('')

  const [orgId, setOrgId] = useState<
    number | null
  >(null)

  const [students, setStudents] =
    useState<Profile[]>([])

  const [conversations, setConversations] =
    useState<Conversation[]>([])

  const [messages, setMessages] =
    useState<Message[]>([])

  const [
    selectedConversation,
    setSelectedConversation,
  ] = useState<number | null>(null)

  const [selectedStudent, setSelectedStudent] =
    useState('')

  const [content, setContent] =
    useState('')

  const [error, setError] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
      subscribeRealtime(
        selectedConversation
      )
    }
  }, [selectedConversation])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages])

  async function load() {
    setLoading(true)
    setError('')

    const { data: auth } =
      await supabase.auth.getUser()

    const uid = auth.user?.id

    if (!uid) {
      setError('Sesión no encontrada')
      setLoading(false)
      return
    }

    setUserId(uid)

    const { data: org } =
      await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', uid)
        .maybeSingle()

    let resolvedOrgId =
      org?.id as number | undefined

    if (!resolvedOrgId) {
      const { data: mem } =
        await supabase
          .from('memberships')
          .select('org_id')
          .eq('user_id', uid)
          .in('role', [
            'owner',
            'coach',
          ])
          .maybeSingle()

      resolvedOrgId =
        mem?.org_id as
          | number
          | undefined
    }

    if (!resolvedOrgId) {
      setError(
        'No encontramos tu academia.'
      )

      setLoading(false)
      return
    }

    setOrgId(resolvedOrgId)

    const { data: memberships } =
      await supabase
        .from('memberships')
        .select('user_id')
        .eq('org_id', resolvedOrgId)
        .eq('role', 'alumno')
        .eq('status', 'active')

    const ids = (
      memberships || []
    ).map((m: any) => m.user_id)

    if (ids.length) {
      const { data: profs } =
        await supabase
          .from('profiles')
          .select(
            'id,full_name,email,role'
          )
          .in('id', ids)
          .order('full_name')

      setStudents(
        (profs || []) as Profile[]
      )

      setSelectedStudent(
        (prev) =>
          prev ||
          profs?.[0]?.id ||
          ''
      )
    }

    const { data: conv } =
      await supabase
        .from('conversations')
        .select('*')
        .eq('org_id', resolvedOrgId)
        .eq('profe_id', uid)
        .order('last_message_at', {
          ascending: false,
        })

    const list =
      (conv || []) as Conversation[]

    setConversations(list)

    setSelectedConversation(
      (prev) =>
        prev || list[0]?.id || null
    )

    setLoading(false)
  }

  async function loadMessages(
    conversationId: number
  ) {
    const { data, error } =
      await supabase
        .from('messages')
        .select('*')
        .eq(
          'conversation_id',
          conversationId
        )
        .order('created_at')

    if (error) {
      setError(error.message)
    } else {
      setMessages(
        (data || []) as Message[]
      )
    }
  }

  function subscribeRealtime(
    conversationId: number
  ) {
    const channel = supabase
      .channel(
        `messages-${conversationId}`
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [
            ...prev,
            payload.new as Message,
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  async function createConversation() {
    if (
      !orgId ||
      !userId ||
      !selectedStudent
    )
      return

    setError('')

    const { data, error } =
      await supabase
        .from('conversations')
        .upsert(
          {
            org_id: orgId,
            profe_id: userId,
            alumno_id:
              selectedStudent,
          },
          {
            onConflict:
              'org_id,profe_id,alumno_id',
          }
        )
        .select('*')
        .single()

    if (error) {
      setError(error.message)
    } else {
      await load()
      setSelectedConversation(
        data.id
      )
    }
  }

  async function sendMessage(
    e: React.FormEvent
  ) {
    e.preventDefault()

    if (
      !selectedConversation ||
      !content.trim()
    )
      return

    const text = content.trim()

    setContent('')

    const { error } =
      await supabase
        .from('messages')
        .insert({
          conversation_id:
            selectedConversation,
          sender_id: userId,
          content: text,
        })

    if (error) {
      setError(error.message)
      setContent(text)
    }
  }

  const selected =
    conversations.find(
      (c) =>
        c.id ===
        selectedConversation
    )

  const selectedStudentProfile =
    selected
      ? students.find(
          (s) =>
            s.id ===
            selected.alumno_id
        )
      : null

  if (loading) {
    return (
      <div className="loader">
        Cargando mensajes...
      </div>
    )
  }

  return (
    <div>
      <div className="page-title">
        MENSAJES
      </div>

      <div className="page-sub">
        Comunicación directa con tus
        alumnos.
      </div>

      {error && (
        <div
          className="alert-error"
          style={{
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '320px 1fr',
          gap: 18,
        }}
      >
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: 1.5,
                textTransform:
                  'uppercase',
                color: '#666',
              }}
            >
              Conversaciones
            </div>

            <div
              style={{
                color: '#c8f542',
                fontSize: 12,
              }}
            >
              {conversations.length}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <select
              value={
                selectedStudent
              }
              onChange={(e) =>
                setSelectedStudent(
                  e.target.value
                )
              }
              style={field}
            >
              {students.map((s) => (
                <option
                  key={s.id}
                  value={s.id}
                >
                  {s.full_name ||
                    s.email}
                </option>
              ))}
            </select>

            <button
              className="btn btn-primary"
              onClick={
                createConversation
              }
            >
              +
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection:
                'column',
              gap: 8,
            }}
          >
            {conversations.map(
              (c) => {
                const st =
                  students.find(
                    (s) =>
                      s.id ===
                      c.alumno_id
                  )

                return (
                  <button
                    key={c.id}
                    onClick={() =>
                      setSelectedConversation(
                        c.id
                      )
                    }
                    className="btn btn-ghost"
                    style={{
                      justifyContent:
                        'flex-start',
                      borderColor:
                        c.id ===
                        selectedConversation
                          ? '#c8f542'
                          : 'rgba(255,255,255,0.1)',
                      color:
                        c.id ===
                        selectedConversation
                          ? '#c8f542'
                          : '#888',
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius:
                          '50%',
                        background:
                          '#222',
                        display:
                          'inline-flex',
                        alignItems:
                          'center',
                        justifyContent:
                          'center',
                      }}
                    >
                      {(
                        st?.full_name ||
                        'A'
                      )[0]}
                    </span>

                    {st?.full_name ||
                      st?.email ||
                      'Alumno'}
                  </button>
                )
              }
            )}
          </div>
        </div>

        <div
          className="card"
          style={{
            minHeight: 560,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {selected ? (
            <>
              <div
                style={{
                  paddingBottom: 14,
                  borderBottom:
                    '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems:
                    'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily:
                        'Bebas Neue',
                      letterSpacing: 2,
                      fontSize: 26,
                    }}
                  >
                    {selectedStudentProfile?.full_name ||
                      'Alumno'}
                  </div>

                  <div
                    style={{
                      color: '#666',
                      fontSize: 12,
                    }}
                  >
                    {
                      selectedStudentProfile?.email
                    }
                  </div>
                </div>

                <div
                  style={{
                    color: '#00ff88',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  ● online
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY:
                    'auto',
                  padding:
                    '18px 0',
                  display: 'flex',
                  flexDirection:
                    'column',
                  gap: 10,
                }}
              >
                {messages.map(
                  (m) => {
                    const own =
                      m.sender_id ===
                      userId

                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf:
                            own
                              ? 'flex-end'
                              : 'flex-start',
                          maxWidth:
                            '72%',
                        }}
                      >
                        <div
                          style={{
                            background:
                              own
                                ? '#c8f542'
                                : '#222',
                            color:
                              own
                                ? '#070707'
                                : '#f0efe8',
                            padding:
                              '12px 16px',
                            borderRadius: 16,
                            fontSize: 14,
                            lineHeight: 1.4,
                          }}
                        >
                          {
                            m.content
                          }
                        </div>

                        <div
                          style={{
                            color:
                              '#555',
                            fontSize: 10,
                            marginTop: 4,
                            textAlign:
                              own
                                ? 'right'
                                : 'left',
                          }}
                        >
                          {new Date(
                            m.created_at
                          ).toLocaleString()}
                        </div>
                      </div>
                    )
                  }
                )}

                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={
                  sendMessage
                }
                style={{
                  display: 'flex',
                  gap: 10,
                  borderTop:
                    '1px solid rgba(255,255,255,0.06)',
                  paddingTop: 14,
                }}
              >
                <input
                  value={content}
                  onChange={(e) =>
                    setContent(
                      e.target.value
                    )
                  }
                  placeholder="Escribe un mensaje..."
                  style={field}
                />

                <button className="btn btn-primary">
                  ENVIAR
                </button>
              </form>
            </>
          ) : (
            <div
              style={{
                color: '#555',
                textAlign: 'center',
                padding: 80,
              }}
            >
              Selecciona o crea una
              conversación.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const field: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: '#222',
  border:
    '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: '#f0efe8',
  outline: 'none',
}