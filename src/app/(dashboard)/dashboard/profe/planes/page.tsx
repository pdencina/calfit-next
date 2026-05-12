'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Plan = {
  name: string
  price: string
  maxStudents: string
  features: string[]
  recommended?: boolean
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: '$0',
    maxStudents: 'Hasta 3 alumnos',
    features: [
      'Rutinas básicas',
      'Asignación manual',
      'Historial simple',
      'Chat básico',
    ],
  },
  {
    name: 'Coach Pro',
    price: '$9.990',
    maxStudents: 'Hasta 20 alumnos',
    recommended: true,
    features: [
      'Biblioteca CALFIT',
      'Rutinas ilimitadas',
      'Métricas de alumnos',
      'Objetivos y progreso',
      'Chat coach/alumno',
    ],
  },
  {
    name: 'Academy',
    price: '$24.990',
    maxStudents: 'Hasta 100 alumnos',
    features: [
      'Multi coach',
      'Ranking de alumnos',
      'Reportes avanzados',
      'Marca de academia',
      'Soporte prioritario',
    ],
  },
  {
    name: 'Unlimited',
    price: '$49.990',
    maxStudents: 'Alumnos ilimitados',
    features: [
      'Todo incluido',
      'Academias ilimitadas',
      'Analytics avanzado',
      'Marketplace de rutinas',
      'Soporte premium',
    ],
  },
]

export default function ProfePlanPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [studentCount, setStudentCount] = useState(0)
  const [routineCount, setRoutineCount] = useState(0)
  const [currentPlan, setCurrentPlan] = useState('Coach Pro')
  const [message, setMessage] = useState('')

  async function loadData() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, academia_id, plan')
      .eq('id', user.id)
      .single()

    if (profile?.plan) {
      setCurrentPlan(profile.plan)
    }

    const { data: students } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'alumno')
      .eq('academia_id', profile?.academia_id)

    setStudentCount(students?.length || 0)

    const { data: routines } = await supabase
      .from('routines')
      .select('id')
      .eq('profe_id', user.id)
      .eq('is_template', false)

    setRoutineCount(routines?.length || 0)

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function selectPlan(planName: string) {
    setMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ plan: planName })
      .eq('id', user.id)

    if (error) {
      setMessage(error.message)
      return
    }

    setCurrentPlan(planName)
    setMessage(`Plan actualizado a ${planName}.`)
  }

  if (loading) {
    return <div style={styles.page}>Cargando plan...</div>
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Mi Plan</h1>
          <p style={styles.subtitle}>
            Administra tu suscripción y escala tu academia.
          </p>
        </div>

        <div style={styles.currentPlan}>
          Plan actual: <strong>{currentPlan}</strong>
        </div>
      </div>

      {message && <div style={styles.notice}>{message}</div>}

      <div style={styles.usageGrid}>
        <div style={styles.usageCard}>
          <span style={styles.usageNumber}>{studentCount}</span>
          <span style={styles.usageLabel}>Alumnos activos</span>
        </div>

        <div style={styles.usageCard}>
          <span style={styles.usageNumber}>{routineCount}</span>
          <span style={styles.usageLabel}>Rutinas creadas</span>
        </div>

        <div style={styles.usageCard}>
          <span style={styles.usageNumber}>CLP</span>
          <span style={styles.usageLabel}>Moneda local</span>
        </div>
      </div>

      <div style={styles.plansGrid}>
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.name

          return (
            <div
              key={plan.name}
              style={{
                ...styles.planCard,
                borderColor: plan.recommended
                  ? '#c8f542'
                  : 'rgba(255,255,255,.08)',
              }}
            >
              {plan.recommended && (
                <div style={styles.recommended}>RECOMENDADO</div>
              )}

              <h2 style={styles.planName}>{plan.name}</h2>

              <div style={styles.price}>
                {plan.price}
                <span style={styles.month}> / mes</span>
              </div>

              <p style={styles.maxStudents}>{plan.maxStudents}</p>

              <div style={styles.features}>
                {plan.features.map((feature) => (
                  <div key={feature} style={styles.feature}>
                    ✅ {feature}
                  </div>
                ))}
              </div>

              <button
                style={{
                  ...styles.button,
                  opacity: isCurrent ? 0.5 : 1,
                }}
                disabled={isCurrent}
                onClick={() => selectPlan(plan.name)}
              >
                {isCurrent ? 'Plan actual' : 'Elegir plan'}
              </button>
            </div>
          )
        })}
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Próximo paso comercial</h2>

        <p style={styles.text}>
          Cuando conectemos pagos, este botón podrá enviar al coach a
          MercadoPago, Stripe o Webpay para activar el plan automáticamente.
        </p>

        <div style={styles.roadmap}>
          <span>💳 Integración pagos</span>
          <span>📄 Facturación</span>
          <span>🔐 Límites por plan</span>
          <span>📈 Upgrade automático</span>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 32,
    color: '#fff',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 20,
    alignItems: 'center',
    marginBottom: 30,
  },

  title: {
    fontSize: 42,
    margin: 0,
    fontWeight: 900,
  },

  subtitle: {
    color: '#8a8a8a',
    marginTop: 10,
  },

  currentPlan: {
    background: '#111',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 18,
    padding: '16px 20px',
    color: '#c8f542',
  },

  notice: {
    background: 'rgba(200,245,66,.08)',
    border: '1px solid rgba(200,245,66,.25)',
    color: '#c8f542',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },

  usageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
    gap: 20,
    marginBottom: 30,
  },

  usageCard: {
    background: '#111',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 24,
    padding: 24,
  },

  usageNumber: {
    display: 'block',
    color: '#c8f542',
    fontSize: 38,
    fontWeight: 900,
  },

  usageLabel: {
    color: '#8a8a8a',
    marginTop: 8,
    display: 'block',
  },

  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
    gap: 20,
    marginBottom: 30,
  },

  planCard: {
    position: 'relative',
    background: '#111',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 26,
    padding: 26,
  },

  recommended: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: '#c8f542',
    color: '#000',
    borderRadius: 999,
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 900,
  },

  planName: {
    color: '#fff',
    marginTop: 0,
    fontSize: 26,
  },

  price: {
    color: '#c8f542',
    fontSize: 34,
    fontWeight: 900,
    marginBottom: 10,
  },

  month: {
    color: '#8a8a8a',
    fontSize: 14,
  },

  maxStudents: {
    color: '#8a8a8a',
    marginBottom: 20,
  },

  features: {
    display: 'grid',
    gap: 10,
    marginBottom: 24,
  },

  feature: {
    color: '#ddd',
    fontSize: 14,
  },

  button: {
    width: '100%',
    background: '#c8f542',
    color: '#000',
    border: 0,
    borderRadius: 14,
    padding: 15,
    fontWeight: 900,
    cursor: 'pointer',
  },

  card: {
    background: '#111',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 24,
    padding: 24,
  },

  sectionTitle: {
    marginTop: 0,
    fontSize: 26,
  },

  text: {
    color: '#8a8a8a',
    lineHeight: 1.6,
  },

  roadmap: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 18,
  },
}