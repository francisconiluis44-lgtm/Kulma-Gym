export type TerminologiaClase = {
  singular: string
  plural: string
  Plural: string
}

export function getTerminologiaClase(slug: string): TerminologiaClase {
  if (slug === 'taba') {
    return { singular: 'turno', plural: 'turnos', Plural: 'Turnos' }
  }
  return { singular: 'clase', plural: 'clases', Plural: 'Clases' }
}
