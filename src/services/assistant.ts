import Anthropic from '@anthropic-ai/sdk'
import { getAlumnosConMembresiaVencida, getAlumnosConMembresiaProximaAVencer, getAlumnoResumen } from './alumnos'
import { getFacturacionMesActual } from './cobros'
import { getAlumnosSinAsistir, getResumenAsistencia } from './asistencias'
import { getPrioridadesDelDia } from './dashboard'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Sos SimpleGym IA, un asistente para propietarios y profesores de gimnasios.

Tu función es consultar y analizar información existente del gimnasio para ayudar a tomar decisiones.

Reglas:
- Solo podés acceder a datos mediante las herramientas disponibles. Nunca inventes datos.
- Nunca modifiques información. No podés registrar pagos, editar alumnos ni enviar mensajes.
- Podés sugerir acciones concretas, pero la decisión final es siempre del usuario.
- Si no hay información suficiente, indicá claramente qué dato falta.
- Respondé en español rioplatense, de forma breve y orientada a la acción.
- Cuando presentes listas: resumí el total primero, después el detalle.
- No muestres IDs internos, tokens ni detalles técnicos.
- No menciones las herramientas que usaste ni el nombre de las funciones internas.`

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
    description: 'Muestra la facturación del mes actual, cantidad de cobros, renovaciones, y comparación con el mes anterior.',
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
  const firstTurn = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: TOOLS,
    messages: [{ role: 'user', content: message }],
  })

  let tokensIn = firstTurn.usage.input_tokens
  let tokensOut = firstTurn.usage.output_tokens

  if (firstTurn.stop_reason === 'end_turn') {
    const text = firstTurn.content.find(b => b.type === 'text')?.text ?? 'No pude generar una respuesta.'
    return { response: text, toolUsed: null, tokensIn, tokensOut }
  }

  if (firstTurn.stop_reason === 'tool_use') {
    const toolUseBlock = firstTurn.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    if (!toolUseBlock) {
      return { response: 'No pude analizar la información en este momento.', toolUsed: null, tokensIn, tokensOut }
    }

    const toolResult = await executeTool(
      toolUseBlock.name,
      toolUseBlock.input as Record<string, unknown>,
      gimnasioId,
    )

    const secondTurn = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: [
        { role: 'user', content: message },
        { role: 'assistant', content: firstTurn.content },
        {
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: JSON.stringify(toolResult),
          }],
        },
      ],
    })

    tokensIn += secondTurn.usage.input_tokens
    tokensOut += secondTurn.usage.output_tokens

    const text = secondTurn.content.find(b => b.type === 'text')?.text ?? 'No pude generar una respuesta.'
    return { response: text, toolUsed: toolUseBlock.name, tokensIn, tokensOut }
  }

  return { response: 'No pude procesar tu consulta. Intentá nuevamente.', toolUsed: null, tokensIn, tokensOut }
}
