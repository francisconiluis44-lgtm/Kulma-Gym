import Anthropic from '@anthropic-ai/sdk'
import { getAlumnosConMembresiaVencida, getAlumnosConMembresiaProximaAVencer, getAlumnoResumen } from './alumnos'
import { getFacturacionMesActual } from './cobros'
import { getAlumnosSinAsistir, getResumenAsistencia, getAlumnosEnRiesgo, getAsistenciaPorRango } from './asistencias'
import { getPrioridadesDelDia } from './dashboard'
import { getHistorialContactos, getResumenContactos } from './contactos'

const SYSTEM_PROMPT = `Sos SimpleGym IA, un asistente para propietarios y profesores de gimnasios.

Tu función es consultar y analizar información existente del gimnasio para ayudar a tomar decisiones.

ESTILO DE RESPUESTA (máxima prioridad):
- Respondé primero y únicamente la consulta concreta. No respondas las preguntas que el usuario todavía no hizo.
- No agregues escenarios futuros, consecuencias, riesgos, proyecciones ni planes de acción salvo que el usuario los pida.
- Mostrá solo los datos necesarios para responder. No repetás información.
- No incluyas secciones como "limitaciones", "oportunidades", "impacto" o "siguiente paso" salvo que sean indispensables para responder la pregunta.
- Extensión esperada: consulta simple o listado → 2 a 8 líneas. Comparación o análisis breve → hasta 12 líneas. Informe detallado SOLO si el usuario pide explícitamente "analizá", "explicá en detalle", "armá un plan" o "hacé un informe".
- Si tiene sentido ofrecer más contexto, cerrá con una frase breve: "Si querés, te muestro el detalle."
- Dejá que el usuario pida profundidad. No la des por defecto.

USO DE HERRAMIENTAS:
- Cuando una pregunta requiera datos disponibles mediante una herramienta, consultala sin pedir permiso. No preguntes "¿Querés que verifique?" si podés comprobarlo ahora.
- Elegí siempre la herramienta más específica que pueda responder la consulta. No uses herramientas de resumen general cuando una herramienta especializada sea suficiente. Ejemplo: para "¿quién vence hoy?" usá "listar_membresias_por_vencer", no "obtener_prioridades_del_dia".
- Para recomendar a quién contactar primero: usá primero el campo "ultimoContacto" que devuelven herramientas como "listar_alumnos_en_riesgo" o "listar_membresias_por_vencer". Llamá a "ver_historial_contactos" solo cuando esa información no esté disponible o cuando el usuario pida el detalle del seguimiento.
- Para priorizar: considerá estado de membresía, fecha de vencimiento e historial de contactos en conjunto, no por separado.
- Si una herramienta no devuelve historial o está vacía, aclaralo brevemente y priorizá con los datos disponibles.
- No uses frases condicionales que el usuario deba resolver ("si fue contactado", "si tiene membresía activa") cuando una herramienta puede confirmarlo.

REGLAS DE DATOS:
- Solo podés acceder a datos mediante las herramientas disponibles. Nunca inventes datos.
- Nunca modifiques información. No podés registrar pagos, editar alumnos ni enviar mensajes.
- No muestres IDs internos, tokens ni detalles técnicos. No menciones herramientas ni funciones internas.
- Cuando presentes listas: resumí el total primero, después el detalle ordenado por urgencia.
- Cuando priorices contactos, usá este orden: 1° vence hoy, 2° vence en los próximos días (de menor a mayor), 3° ya vencidas (de más reciente a más antigua). Si el historial de contactos ajusta el orden, mencionalo. Siempre explicá brevemente el criterio usado: "Ordené priorizando los vencimientos más próximos, luego los ya vencidos." No inventes criterios ni factores de priorización que no estén presentes en los datos disponibles.
- Personalidad: cercana, profesional y argentina. Tratá al usuario de "profe".
- Nunca hagas afirmaciones categóricas sobre conducta de alumnos. Describí los hechos: "no registraron asistencia en X días".
- Nunca inferrás situaciones no confirmadas por los datos. Distinguí siempre entre dos casos que el backend diferencia explícitamente: (a) sinRegistroAsistencia = true → decí "no registra asistencias en el sistema"; (b) existe última asistencia pero superó el umbral → decí "no asiste desde hace X días". No uses la misma frase para ambos casos.
- Cuando un alumno tenga membresía activa pero sin registros de asistencia, informá solo ese dato. No interpretes que perdió interés, que dejó de venir o que está por abandonar. Para recomendar seguimiento usá una formulación neutral: "Son candidatos para contactar antes del vencimiento." Evitá "recuperar" (implica que eran activos y dejaron de venir), "validar si continúan interesados" y expresiones similares que asuman historial sin datos que lo confirmen.
- No infierás consecuencias del sistema que no estén confirmadas. No digas "pierde acceso", "se bloquea automáticamente" ni nada similar salvo que los datos lo confirmen.
- No mostrés métricas que no cambian la respuesta a la pregunta concreta. Ante "¿qué debería hacer hoy?", no incluyas facturación ni ingresos generales salvo que sean necesarios para definir la prioridad solicitada.
- Membresía vencida NO es deuda. Nunca uses "cartera vencida" ni "morosos". Usá "oportunidad de renovación".
- No propongas servicios, descuentos, campañas ni funcionalidades que no estén confirmados en los datos.
- No presentes supuestos como hechos. Reemplazá "práctica de la industria" o "típicamente un X%" por "no dispongo de datos para afirmarlo".
- No sugerás contactar a alguien ya gestionado recientemente. Verificá el campo "ultimoContacto" antes de recomendar. Si no está disponible en la herramienta principal, usá "ver_historial_contactos".
- Usá la herramienta "calcular" para toda cifra derivada, estimada o porcentual. No la uses para valores literales que ya devolvió una herramienta.
- Nunca conviertas una población en una proyección sin tasa histórica real. Sin historial, mostrá solo el máximo teórico.
- "Caja sana" no puede derivarse solo de facturación. Sin costos y gastos, no evaluás salud financiera.
- Para estadísticas de asistencia parciales (diasConAsistencia < 15): solo describí, nunca inferrás tendencias.`

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'listar_membresias_vencidas',
    description: 'Lista los alumnos con membresía vencida, ordenados por antigüedad del vencimiento.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'listar_alumnos_inactivos',
    description: 'Lista los alumnos con membresía activa que no asistieron en los últimos N días.',
    input_schema: {
      type: 'object' as const,
      properties: {
        dias: {
          type: 'number' as const,
          description: 'Cantidad de días sin asistir. Por defecto 14.',
        },
      },
      required: [],
    },
  },
  {
    name: 'comparar_facturacion',
    description: 'Muestra la facturación del mes actual, cantidad de cobros, ticket promedio, alumnos que renovaron, y comparación porcentual con el mes anterior.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'obtener_prioridades_del_dia',
    description: 'Devuelve un resumen de las prioridades del día: membresías vencidas, por vencer, alumnos inactivos e ingresos del mes.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'resumir_asistencia',
    description: 'Muestra estadísticas de asistencia del mes actual: total, promedio diario y día de la semana con más concurrencia.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'consultar_asistencia_rango',
    description: 'Muestra asistencias en un rango de fechas específico. Usá esta herramienta para preguntas como "asistencia de la semana pasada", "lunes a viernes de esta semana", "del 10 al 15 de julio", etc. Calculá las fechas desde/hasta según la fecha de hoy indicada en el contexto.',
    input_schema: {
      type: 'object' as const,
      properties: {
        desde: {
          type: 'string' as const,
          description: 'Fecha de inicio en formato YYYY-MM-DD.',
        },
        hasta: {
          type: 'string' as const,
          description: 'Fecha de fin en formato YYYY-MM-DD (inclusive).',
        },
      },
      required: ['desde', 'hasta'],
    },
  },
  {
    name: 'consultar_alumno',
    description: 'Busca un alumno por nombre y muestra su estado de membresía, asistencias del mes y últimos cobros.',
    input_schema: {
      type: 'object' as const,
      properties: {
        nombre: {
          type: 'string' as const,
          description: 'Nombre o apellido del alumno a buscar.',
        },
      },
      required: ['nombre'],
    },
  },
  {
    name: 'listar_membresias_por_vencer',
    description: 'Lista los alumnos con membresía activa que vence en los próximos N días.',
    input_schema: {
      type: 'object' as const,
      properties: {
        dias: {
          type: 'number' as const,
          description: 'Cantidad de días hacia adelante para buscar vencimientos. Por defecto 7.',
        },
      },
      required: [],
    },
  },
  {
    name: 'listar_alumnos_en_riesgo',
    description: 'Lista alumnos con membresía activa que no asistieron en los últimos N días. Devuelve por alumno: días sin asistir, días hasta el vencimiento de la membresía y fecha del último contacto registrado. Usá esta herramienta para responder preguntas como "¿quién paga pero no viene?", "¿a quién debería recuperar?", "¿quiénes están por abandonar?".',
    input_schema: {
      type: 'object' as const,
      properties: {
        dias: {
          type: 'number' as const,
          description: 'Cantidad de días sin asistir para considerar al alumno en riesgo. Por defecto 14.',
        },
      },
      required: [],
    },
  },
  {
    name: 'ver_historial_contactos',
    description: 'Muestra los contactos registrados con alumnos en los últimos 30 días: a quién se contactó, cuándo, por qué canal y con qué resultado. Útil para saber quiénes ya tienen seguimiento y cuáles son los resultados de las gestiones comerciales.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'calcular',
    description: 'Calculadora aritmética verificada. Recibí pasos de cálculo con valores numéricos concretos y devuelvo los resultados exactos. Usá esta herramienta siempre que necesites hacer una operación aritmética para presentar proyecciones, estimaciones o comparaciones. NUNCA hagas los cálculos vos mismo.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pasos: {
          type: 'array' as const,
          description: 'Lista de operaciones a calcular, en orden.',
          items: {
            type: 'object' as const,
            properties: {
              descripcion: { type: 'string' as const, description: 'Descripción legible del paso.' },
              a: { type: 'number' as const, description: 'Primer operando.' },
              operador: { type: 'string' as const, description: 'Operador: +, -, *, /' },
              b: { type: 'number' as const, description: 'Segundo operando.' },
              unidad: { type: 'string' as const, description: 'Unidad o categoría del resultado. Ej: "pesos", "alumnos", "%", "ingresos recuperados".' },
            },
            required: ['descripcion', 'a', 'operador', 'b'],
          },
        },
      },
      required: ['pasos'],
    },
  },
]

async function executeTool(name: string, input: Record<string, unknown>, gimnasioId: string): Promise<unknown> {
  switch (name) {
    case 'listar_membresias_vencidas':
      return getAlumnosConMembresiaVencida(gimnasioId)
    case 'listar_alumnos_inactivos':
      return getAlumnosSinAsistir(gimnasioId, typeof input.dias === 'number' ? input.dias : 14)
    case 'comparar_facturacion':
      return getFacturacionMesActual(gimnasioId)
    case 'obtener_prioridades_del_dia':
      return getPrioridadesDelDia(gimnasioId)
    case 'resumir_asistencia':
      return getResumenAsistencia(gimnasioId)
    case 'consultar_asistencia_rango':
      return getAsistenciaPorRango(gimnasioId, String(input.desde ?? ''), String(input.hasta ?? ''))
    case 'consultar_alumno':
      return getAlumnoResumen(gimnasioId, String(input.nombre ?? ''))
    case 'listar_membresias_por_vencer':
      return getAlumnosConMembresiaProximaAVencer(gimnasioId, typeof input.dias === 'number' ? input.dias : 7)
    case 'listar_alumnos_en_riesgo':
      return getAlumnosEnRiesgo(gimnasioId, typeof input.dias === 'number' ? input.dias : 14)
    case 'ver_historial_contactos':
      return getHistorialContactos(gimnasioId)
    case 'calcular': {
      const pasos = Array.isArray(input.pasos) ? input.pasos : []
      const resultados = pasos.map((p: { descripcion: string; a: number; operador: string; b: number; unidad?: string }) => {
        let resultado: number
        switch (p.operador) {
          case '+': resultado = p.a + p.b; break
          case '-': resultado = p.a - p.b; break
          case '*': resultado = p.a * p.b; break
          case '/': resultado = p.b !== 0 ? p.a / p.b : NaN; break
          default: resultado = NaN
        }
        const valor = Number.isNaN(resultado) ? null : Math.round(resultado * 100) / 100
        return {
          descripcion: p.descripcion,
          formula: `${p.a} ${p.operador} ${p.b}`,
          resultado: valor ?? 'Error: división por cero o operador inválido',
          unidad: p.unidad ?? null,
        }
      })
      return { pasos: resultados }
    }
    default:
      return { error: 'Herramienta no disponible.' }
  }
}

export type AssistantResult = {
  response: string
  toolUsed: string | null
  tokensIn: number
  tokensOut: number
}

export async function chat(message: string, gimnasioId: string): Promise<AssistantResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurada')
  const client = new Anthropic({ apiKey, maxRetries: 3 })

  const hoyAR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  const DIAS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const diaSemanaHoy = DIAS_ES[new Date(hoyAR + 'T12:00:00Z').getDay()]
  const systemWithDate = SYSTEM_PROMPT + `\n\nFECHA DE HOY (Argentina): ${hoyAR} (${diaSemanaHoy}). Usá esta fecha para calcular rangos relativos como "esta semana", "semana pasada", "ayer", etc.`

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: message }]
  let tokensIn = 0
  let tokensOut = 0
  let firstToolUsed: string | null = null
  const MAX_ROUNDS = 6
  const calledTools = new Set<string>()

  for (let round = 0; round < MAX_ROUNDS; round++) {
    console.error(`[AI] round ${round + 1} — messages: ${messages.length}`)
    const turn = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemWithDate,
      tools: TOOLS,
      messages,
    })

    tokensIn += turn.usage.input_tokens
    tokensOut += turn.usage.output_tokens
    console.error(`[AI] stop_reason: ${turn.stop_reason} — tokens in: ${tokensIn} out: ${tokensOut}`)

    if (turn.stop_reason === 'end_turn' || turn.stop_reason === 'max_tokens') {
      const text = turn.content.find(b => b.type === 'text')?.text ?? 'No pude generar una respuesta.'
      return { response: text, toolUsed: firstToolUsed, tokensIn, tokensOut }
    }

    if (turn.stop_reason === 'tool_use') {
      const toolUseBlocks = turn.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
      if (toolUseBlocks.length === 0) break

      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => {
          const key = `${block.name}:${JSON.stringify(block.input)}`
          if (calledTools.has(key)) {
            console.error(`[AI] dedup: ${block.name} ya fue llamada con los mismos args`)
            return { type: 'tool_result' as const, tool_use_id: block.id, content: JSON.stringify({ error: 'Datos ya consultados.' }) }
          }
          calledTools.add(key)
          if (!firstToolUsed) firstToolUsed = block.name
          console.error(`[AI] tool: ${block.name}`)
          const t0 = Date.now()
          try {
            const result = await executeTool(block.name, block.input as Record<string, unknown>, gimnasioId)
            console.error(`[AI] tool ${block.name} OK — ${Date.now() - t0}ms — ${JSON.stringify(result).length} chars`)
            return { type: 'tool_result' as const, tool_use_id: block.id, content: JSON.stringify(result) }
          } catch (e) {
            console.error(`[AI] tool ${block.name} ERROR — ${e}`)
            return { type: 'tool_result' as const, tool_use_id: block.id, content: JSON.stringify({ error: 'No se pudo obtener información.' }) }
          }
        }),
      )

      messages.push({ role: 'assistant', content: turn.content })
      messages.push({ role: 'user', content: toolResults })
    } else {
      break
    }
  }

  console.error('[AI] loop exhausted without end_turn')
  return { response: 'No pude procesar tu consulta. Intentá nuevamente.', toolUsed: firstToolUsed, tokensIn, tokensOut }
}
