const WHATSAPP = '542477221589'

export default function UpgradeGate({ requiredPlan }: { requiredPlan: string }) {
  const link = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola! Quiero actualizar mi plan de SimpleGym.')}`

  return (
    <div className="bg-white rounded-2xl shadow-sm px-8 py-14 text-center max-w-md">
      <p className="text-5xl mb-5">🔒</p>
      <h3 className="text-xl font-heading font-bold text-navy mb-2">
        Función del plan {requiredPlan}
      </h3>
      <p className="text-sm text-navy/50 font-body mb-8 leading-relaxed">
        Esta función está disponible en el plan {requiredPlan} o superior.
        Contactanos para actualizar.
      </p>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold font-body rounded-xl transition-colors text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.123 1.522 5.862L.057 23.486a.75.75 0 00.918.938l5.86-1.517A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.694-.525-5.222-1.438l-.374-.22-3.88 1.004 1.028-3.758-.242-.388A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
        Hablar con SimpleGym
      </a>
    </div>
  )
}
