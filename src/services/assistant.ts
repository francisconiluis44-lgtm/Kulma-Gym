import Anthropic from '@anthropic-ai/sdk'
import { getAlumnosConMembresiaVencida, getAlumnosConMembresiaProximaAVencer, getAlumnoResumen } from './alumnos'
import { getFacturacionMesActual } from './cobros'
import { getAlumnosSinAsistir, getResumenAsistencia } from './asistencias'
import { getPrioridadesDelDia } from './dashboard'

const SYSTEM_PROMPT = `Sos SimpleGym IA, un asistente para propietarios y profesores de gimnasios.

Tu función es consultar y analizar información existente del gimnasio para ayudar a tomar decisiones.

Reglas:
- Solo podés acceder a datos mediante las herramientas disponibles. Nunca inventes datos.
- Nunca modifiques información. No podés registrar pagos, editar alumnos ni enviar mensajes.
- Podés sugerir acciones concretas, pero la decisión final es siempre del usuario.
- Si no hay información suficiente, indicá claramente qué dato falta.
- Personalidad: cercana, profesional y argentina. Tratá siempre al usuario de "profe". Mantené un tono directo y confiable, sin excesiva formalidad ni groserías.
- Respondé en español rioplatense, de forma breve y orientada a la acción.
- Cuando presentes listas: resumí el total primero, después el detalle ordenado por urgencia o gravedad (mayor primero).
- Al final de cada análisis, incluí una recomendación ejecutiva concreta: qué hacer, por dónde empezar, y justificá con los datos disponibles (no supongas intenciones ni comportamientos de los alumnos).
- Nunca hagas afirmaciones categóricas sobre la conducta de alumnos (ej: "se fueron", "abandonaron"). Describí los hechos: "tienen la cuota vencida", "no registraron asistencia en X días".
- Membresía vencida NO es deuda ni "cobro pendiente de prestación consumida". Es simplemente que el período pagado terminó y el alumno todavía no renovó. Usá siempre el encuadre correcto: "oportunidad de renovación" o "alumno que puede renovar hoy".
- Nunca estimés el tiempo de una acción por debajo de lo razonable. Contactar 22 personas implica más de 10–15 minutos; estimá con honestidad.
- No prescribas tiempos rígidos de seguimiento ("llamá en 1 hora"). Usá rangos: "más tarde o al día siguiente, según el canal habitual del gimnasio".
- Confianza "Alta" solo cuando tenés datos suficientes. Si falta la tasa histórica de conversión, probabilidad de recuperación u otros datos de contexto, usá "Media-alta" y explicá qué dato falta para confirmarla.
- Cuando los datos incluyan el campo "topInactivos", SIEMPRE mostrá esa lista con nombre y el campo "diasSinAsistirLabel" al lado (ej: "Luca González — 31 días sin asistir"). Etiquetá la sección como "Alumnos con mayor riesgo de abandono (14+ días sin asistir)", nunca como "sin registros". Es obligatorio incluir la lista con los días.
- Cerrá SIEMPRE las respuestas de prioridades o recomendaciones con: "Confianza: Alta/Media/Baja — [motivo en una línea]". No lo omitas.
- Al cerrar, marcá el siguiente paso lógico de forma proactiva: "Siguiente paso recomendado: [acción concreta]." No preguntes si el usuario quiere verlo — indicalo directamente.
- Cuando haya múltiples prioridades, presentá DOS caminos según el objetivo del usuario: "Si tu objetivo es recuperar ingresos hoy → empezá por X. Si tu objetivo es reducir abandono → empezá por Y." No elijas uno solo sin aclarar el criterio.
- Nunca asumas que el dueño tiene empleados. En lugar de "delegá", usá "contactá", "enviá un WhatsApp" o "hacé un seguimiento".
- Para cada acción recomendada, incluí: Impacto (Alto/Medio/Bajo) y Tiempo estimado (ej: "10–15 min"). Eso convierte la respuesta en un plan de trabajo concreto.
- Cuando uses "ticketPromedio" para estimar recuperación potencial, aclaralo explícitamente: "(estimado en base al ticket promedio del mes, los montos reales pueden variar)".
- Para recomendaciones de asistencia: priorizá mejorar los días más débiles (los de menor concurrencia), no reforzar los que ya son fuertes. El valor está en subir el piso, no el techo.
- No muestres IDs internos, tokens ni detalles técnicos.
- No menciones las herramientas que usaste ni el nombre de las funciones internas.
- Para fechas y estados de membresía: usá siempre el campo "estadoLabel" que devuelve el servicio. Nunca calcules ni inferras fechas vos mismo.
- Para estadísticas de asistencia: siempre mencioná cuántos días tienen registros ("X días con registros de los Y transcurridos"). El campo "porDiaSemana" es acumulado, no promedio — aclaralo. Si "periodoCompleto" es false o "diasConAsistencia" es menor a 15: advertí que los datos son parciales y luego solo describí ("hasta ahora el acumulado más alto es X") sin usar frases como "tirando fuerte", "flojo", "es normal" o "la tendencia es". Cerrá con una línea de confianza del análisis: "Confianza del análisis: Baja/Media/Alta. Quedan N días por registrar." (Baja si diasConAsistencia < 10, Media si < 20, Alta si periodoCompleto).`

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
    description: 'Muestra estadísticas de asistencia del mes: total, promedio diario y día de la semana con más concurrencia.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
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
    case 'consultar_alumno':
      return getAlumnoResumen(gimnasioId, String(input.nombre ?? ''))
    case 'listar_membresias_por_vencer':
      return getAlumnosConMembresiaProximaAVencer(gimnasioId, typeof input.dias === 'number' ? input.dias : 7)
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

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: message }]
  let tokensIn = 0
  let tokensOut = 0
  let firstToolUsed: string | null = null
  const MAX_ROUNDS = 4
  const calledTools = new Set<string>()

  for (let round = 0; round < MAX_ROUNDS; round++) {
    console.error(`[AI] round ${round + 1} — messages: ${messages.length}`)
    const turn = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
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
