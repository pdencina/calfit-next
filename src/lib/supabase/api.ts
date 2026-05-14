// src/lib/supabase/api.ts
// Todas las funciones de base de datos para CALFIT PRO
// Usar desde Server Components con createClient() de server.ts
// Usar desde Client Components con createClient() de client.ts

import type { SupabaseClient } from '@supabase/supabase-js'

// ── Helpers ───────────────────────────────────────────────────────
export const fmtCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0)

// ── Perfil ────────────────────────────────────────────────────────
export async function getProfile(sb: SupabaseClient, uid: string) {
  const { data, error } = await sb.from('profiles').select('*').eq('id', uid).single()
  if (error) throw error
  return data
}

export async function updateProfile(sb: SupabaseClient, uid: string, updates: any) {
  const { data, error } = await sb.from('profiles').update(updates).eq('id', uid).select().single()
  if (error) throw error
  return data
}

// ── Organización ──────────────────────────────────────────────────
export async function getMyOrg(sb: SupabaseClient, uid: string) {
  const { data, error } = await sb
    .from('organizations').select('*, plans(*)')
    .eq('owner_id', uid).single()
  if (error) throw error
  return data
}

export async function updateOrg(sb: SupabaseClient, id: number, updates: any) {
  const { data, error } = await sb
    .from('organizations').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function getTrialStatus(sb: SupabaseClient, orgId: number) {
  const { data, error } = await sb.rpc('get_trial_status', { org_id: orgId })
  if (error) throw error
  return data
}

// ── Alumnos ───────────────────────────────────────────────────────
export async function getAlumnos(sb: SupabaseClient, orgId: number) {
  const { data, error } = await sb
    .from('memberships')
    .select('*, profiles(*)')
    .eq('org_id', orgId)
    .eq('role', 'alumno')
    .eq('status', 'active')
    .order('joined_at', { ascending: false })
  if (error) throw error
  return (data || []).map((m: any) => ({
    ...m.profiles,
    membership_id: m.id,
    joined_at: m.joined_at,
  }))
}

export async function getAlumnoStats(sb: SupabaseClient, orgId: number) {
  const { data, error } = await sb
    .from('alumno_stats').select('*').eq('org_id', orgId)
  if (error) throw error
  return data
}

// ── Rutinas ───────────────────────────────────────────────────────
export async function getRutinasAlumno(sb: SupabaseClient, alumnoId: string) {
  const { data, error } = await sb
    .from('rutinas')
    .select('*, ejercicios(*)')
    .eq('alumno_id', alumnoId)
    .eq('activa', true)
    .order('orden')
  if (error) throw error
  return data
}

export async function getRutinasOrg(sb: SupabaseClient, orgId: number) {
  const { data, error } = await sb
    .from('rutinas')
    .select('*, profiles!rutinas_alumno_id_fkey(full_name), ejercicios(id)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createRutina(sb: SupabaseClient, orgId: number, alumnoId: string, profeId: string, payload: any) {
  const { data, error } = await sb
    .from('rutinas')
    .insert({ org_id: orgId, alumno_id: alumnoId, profe_id: profeId, ...payload })
    .select().single()
  if (error) throw error
  return data
}

export async function updateRutina(sb: SupabaseClient, id: number, updates: any) {
  const { data, error } = await sb
    .from('rutinas').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteRutina(sb: SupabaseClient, id: number) {
  const { error } = await sb.from('rutinas').delete().eq('id', id)
  if (error) throw error
}

// ── Ejercicios ────────────────────────────────────────────────────
export async function createEjercicio(sb: SupabaseClient, rutinaId: number, payload: any) {
  const { data, error } = await sb
    .from('ejercicios').insert({ rutina_id: rutinaId, ...payload }).select().single()
  if (error) throw error
  return data
}

export async function updateEjercicio(sb: SupabaseClient, id: number, updates: any) {
  const { data, error } = await sb
    .from('ejercicios').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteEjercicio(sb: SupabaseClient, id: number) {
  const { error } = await sb.from('ejercicios').delete().eq('id', id)
  if (error) throw error
}

// ── Métricas ──────────────────────────────────────────────────────
export async function getMetricasAlumno(sb: SupabaseClient, uid: string, limit = 20) {
  const { data, error } = await sb
    .from('alumno_metrics').select('*')
    .eq('user_id', uid)
    .order('fecha', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function insertMetrica(sb: SupabaseClient, payload: any) {
  const { data, error } = await sb
    .from('alumno_metrics').upsert(payload).select().single()
  if (error) throw error
  return data
}

// ── Sesiones ──────────────────────────────────────────────────────
export async function createSesion(sb: SupabaseClient, orgId: number, alumnoId: string, rutinaId: number) {
  const { data, error } = await sb
    .from('sesiones')
    .insert({ org_id: orgId, alumno_id: alumnoId, rutina_id: rutinaId })
    .select().single()
  if (error) throw error
  return data
}

export async function completarSesion(sb: SupabaseClient, id: number, payload: any) {
  const { data, error } = await sb
    .from('sesiones').update({ completada: true, ...payload })
    .eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function getSesionesAlumno(sb: SupabaseClient, uid: string, limit = 30) {
  const { data, error } = await sb
    .from('sesiones')
    .select('*, rutinas(nombre,categoria)')
    .eq('alumno_id', uid)
    .order('fecha', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function getSesionesOrg(sb: SupabaseClient, orgId: number, days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data, error } = await sb
    .from('sesiones')
    .select('*, profiles!sesiones_alumno_id_fkey(full_name), rutinas(nombre)')
    .eq('org_id', orgId)
    .gte('fecha', since.toISOString().split('T')[0])
    .order('fecha', { ascending: false })
  if (error) throw error
  return data
}

export async function getEstadisticasAlumno(sb: SupabaseClient, uid: string) {
  const { data } = await sb
    .from('sesiones').select('completada,duracion_min,created_at').eq('alumno_id', uid)
  const total       = data?.length || 0
  const completadas = data?.filter((s: any) => s.completada).length || 0
  const duracion    = data?.reduce((s: number, x: any) => s + (x.duracion_min || 0), 0) || 0
  return { total, completadas, duracion, porcentaje: total ? Math.round(completadas / total * 100) : 0 }
}

// ── Mensajería ────────────────────────────────────────────────────
export async function getConversaciones(sb: SupabaseClient, uid: string) {
  const { data, error } = await sb
    .from('conversations')
    .select('*, alumno:profiles!conversations_alumno_id_fkey(*), profe:profiles!conversations_profe_id_fkey(*)')
    .or(`profe_id.eq.${uid},alumno_id.eq.${uid}`)
    .order('last_message_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getOrCreateConversacion(sb: SupabaseClient, orgId: number, profeId: string, alumnoId: string) {
  const { data: ex } = await sb
    .from('conversations').select('*')
    .eq('org_id', orgId).eq('profe_id', profeId).eq('alumno_id', alumnoId).single()
  if (ex) return ex
  const { data, error } = await sb
    .from('conversations')
    .insert({ org_id: orgId, profe_id: profeId, alumno_id: alumnoId })
    .select().single()
  if (error) throw error
  return data
}

export async function getMessages(sb: SupabaseClient, conversacionId: number, limit = 50) {
  const { data, error } = await sb
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(full_name,avatar_url)')
    .eq('conversation_id', conversacionId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data
}

export async function sendMessage(sb: SupabaseClient, conversacionId: number, senderId: string, content: string) {
  const { data, error } = await sb
    .from('messages')
    .insert({ conversation_id: conversacionId, sender_id: senderId, content })
    .select().single()
  if (error) throw error
  return data
}

// ── Notificaciones ────────────────────────────────────────────────
export async function getNotificaciones(sb: SupabaseClient, uid: string) {
  const { data, error } = await sb
    .from('notifications').select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data
}

export async function marcarLeidasAll(sb: SupabaseClient, uid: string) {
  const { error } = await sb
    .from('notifications').update({ leida: true })
    .eq('user_id', uid).eq('leida', false)
  if (error) throw error
}

// ── Administración (cuotas, contratos) ────────────────────────────
export async function getServicios(sb: SupabaseClient, orgId: number) {
  const { data, error } = await sb
    .from('servicios').select('*').eq('org_id', orgId).eq('activo', true).order('precio')
  if (error) throw error
  return data
}

export async function getCuotas(sb: SupabaseClient, orgId: number, filtros: any = {}) {
  let q = sb
    .from('cuotas')
    .select('*, alumno:profiles!cuotas_alumno_id_fkey(full_name,email)')
    .eq('org_id', orgId)
    .order('fecha_vencimiento', { ascending: false })
  if (filtros.estado)   q = q.eq('estado', filtros.estado)
  if (filtros.alumnoId) q = q.eq('alumno_id', filtros.alumnoId)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function marcarPagada(sb: SupabaseClient, cuotaId: number, metodo: string) {
  const { data, error } = await sb
    .from('cuotas')
    .update({ estado: 'pagado', metodo_pago: metodo, fecha_pago: new Date().toISOString().split('T')[0] })
    .eq('id', cuotaId).select().single()
  if (error) throw error
  return data
}

export async function getDeudores(sb: SupabaseClient, orgId: number) {
  const { data, error } = await sb
    .from('deudores').select('*').eq('org_id', orgId)
  if (error) throw error
  return data
}

export async function getKPIsAdmin(sb: SupabaseClient, orgId: number) {
  const mesActual = new Date().toISOString().slice(0, 7)
  const [cuotas, contratos, deudores] = await Promise.all([
    sb.from('cuotas').select('monto,estado,fecha_vencimiento').eq('org_id', orgId),
    sb.from('contratos').select('id').eq('org_id', orgId).eq('estado', 'activo'),
    sb.from('deudores').select('deuda_total').eq('org_id', orgId),
  ])
  const cuotasMes = (cuotas.data || []).filter((c: any) => c.fecha_vencimiento?.startsWith(mesActual))
  return {
    ingresosDelMes:  cuotasMes.filter((c: any) => c.estado === 'pagado').reduce((s: number, c: any) => s + Number(c.monto), 0),
    porCobrarDelMes: cuotasMes.filter((c: any) => c.estado !== 'pagado').reduce((s: number, c: any) => s + Number(c.monto), 0),
    alumnosActivos:  contratos.data?.length || 0,
    totalDeuda:      (deudores.data || []).reduce((s: number, d: any) => s + Number(d.deuda_total), 0),
    cantDeudores:    deudores.data?.length || 0,
  }
}

export async function getTurnos(sb: SupabaseClient, orgId: number, fechaInicio: string) {
  const fin = new Date(fechaInicio + 'T12:00:00')
  fin.setDate(fin.getDate() + 6)
  const { data, error } = await sb
    .from('turnos')
    .select('*, alumno:profiles!turnos_alumno_id_fkey(full_name)')
    .eq('org_id', orgId)
    .gte('fecha', fechaInicio)
    .lte('fecha', fin.toISOString().split('T')[0])
    .order('fecha').order('hora_inicio')
  if (error) throw error
  return data
}

// ── Platform Admin ─────────────────────────────────────────────────
export async function getPlatformKPIs(sb: SupabaseClient) {
  const { data, error } = await sb.from('admin_platform_kpis').select('*').single()
  if (error) throw error
  return data
}

export async function getOrgsOverview(sb: SupabaseClient, filtro = '') {
  let q = sb.from('admin_orgs_overview').select('*').order('created_at', { ascending: false })
  if (filtro === 'trial')    q = q.eq('plan_status', 'trialing')
  if (filtro === 'active')   q = q.eq('plan_status', 'active')
  if (filtro === 'canceled') q = q.eq('plan_status', 'canceled')
  if (['starter','pro','elite'].includes(filtro)) q = q.eq('plan_id', filtro)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getAllUsers(sb: SupabaseClient, busqueda = '') {
  let q = sb.from('profiles').select('*').order('created_at', { ascending: false }).limit(100)
  if (busqueda) q = q.or(`full_name.ilike.%${busqueda}%,email.ilike.%${busqueda}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}

// ── Invitar alumno (llama a Edge Function) ────────────────────────
export async function invitarAlumno(sb: SupabaseClient, orgId: number, email: string, fullName: string) {
  const { data: { session } } = await sb.auth.getSession()
  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/invite-alumno`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ email, full_name: fullName, org_id: orgId }),
    }
  )
  const data = await resp.json()
  if (!data.success) throw new Error(data.error)
  return data
}
