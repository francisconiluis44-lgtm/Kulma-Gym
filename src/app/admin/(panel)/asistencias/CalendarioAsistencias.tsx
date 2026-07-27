import Link from 'next/link'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

interface Props {
  mes: string
  diasConAsistencia: Record<string, number>
  fechaSeleccionada: string | null
}

export default function CalendarioAsistencias({ mes, diasConAsistencia, fechaSeleccionada }: Props) {
  const [mesYearStr, mesMonthStr] = mes.split('-')
  const mesYear = parseInt(mesYearStr)
  const mesMonth = parseInt(mesMonthStr)

  const prevDate = new Date(Date.UTC(mesYear, mesMonth - 2, 1))
  const nextDate = new Date(Date.UTC(mesYear, mesMonth, 1))
  const prevMes = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}`
  const nextMes = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, '0')}`

  const totalDias = new Date(Date.UTC(mesYear, mesMonth, 0)).getUTCDate()
  const primerDow = new Date(Date.UTC(mesYear, mesMonth - 1, 1)).getUTCDay()
  const offset = primerDow === 0 ? 6 : primerDow - 1

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`?mes=${prevMes}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-navy/5 transition-colors text-navy/40 hover:text-navy font-body text-lg"
        >
          ‹
        </Link>
        <h3 className="font-heading font-bold text-navy text-base">
          {MESES_ES[mesMonth - 1]} {mesYear}
        </h3>
        <Link
          href={`?mes=${nextMes}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-navy/5 transition-colors text-navy/40 hover:text-navy font-body text-lg"
        >
          ›
        </Link>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center text-[10px] font-body text-navy/40 font-semibold py-1 tracking-wide">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="aspect-square" />

          const fecha = `${mes}-${String(day).padStart(2, '0')}`
          const count = diasConAsistencia[fecha] ?? 0
          const isSelected = fecha === fechaSeleccionada

          if (count === 0) {
            return (
              <div key={i} className="aspect-square flex items-center justify-center">
                <span className="text-xs font-body text-navy/25">{day}</span>
              </div>
            )
          }

          return (
            <Link
              key={i}
              href={`?mes=${mes}&fecha=${fecha}`}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-colors gap-0.5
                ${isSelected ? 'bg-orange text-white' : 'bg-navy/5 hover:bg-orange/15 text-navy'}`}
            >
              <span className="text-xs font-body font-semibold leading-none">{day}</span>
              <span className={`text-[9px] font-body leading-none ${isSelected ? 'text-white/70' : 'text-navy/40'}`}>
                {count}
              </span>
            </Link>
          )
        })}
      </div>

      <p className="text-[10px] font-body text-navy/30 text-center mt-3">
        El número indica cuántos alumnos asistieron ese día
      </p>
    </div>
  )
}
