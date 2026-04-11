import { useRef } from 'react'
import sponsors from '../data/sponsors.json'
import { logoUrl } from '../utils/logoUrl'

const sponsorMap = Object.fromEntries(sponsors.map(s => [s.partner, s]))

export default function SponsorEditModal({
  sponsorName,
  events,
  categoryList,
  tags,
  sponsorCategories,
  customLogos,
  onTagsChange,
  onCategoryChange,
  onCustomLogoChange,
  onClose,
  eventGroups,
  groupCategories,
  sponsorGroups,
  onSponsorGroupsChange,
}) {
  const fileRef = useRef(null)
  const sp = sponsorMap[sponsorName]
  const defaultSrc = sp ? logoUrl(sp.filename) : null
  const currentSrc = customLogos[sponsorName] || defaultSrc
  const sponsorEvents = tags[sponsorName] || []

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onCustomLogoChange(sponsorName, ev.target.result)
    reader.readAsDataURL(file)
  }

  function handleResetLogo() {
    onCustomLogoChange(sponsorName, null)
  }

  function toggleEvent(ev, checked) {
    const current = tags[sponsorName] || []
    const next = checked ? [...new Set([...current, ev])] : current.filter(e => e !== ev)
    onTagsChange(next)
    if (!checked) onCategoryChange(ev, '')
  }

  function setCategory(ev, cat) {
    onCategoryChange(ev, cat)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 48px)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-800">{sponsorName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Sponsor bewerken</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2l12 12M14 2L2 14"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Logo section */}
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Logo</p>
            <div className="flex items-center gap-4">
              <div className="w-24 h-16 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 flex-shrink-0 overflow-hidden">
                {currentSrc ? (
                  <img src={currentSrc} alt={sponsorName} className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="text-[10px] text-gray-300">Geen logo</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => fileRef.current.click()}
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Afbeelding vervangen
                </button>
                {customLogos[sponsorName] && (
                  <button
                    onClick={handleResetLogo}
                    className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:border-red-300 hover:text-red-500 transition-colors"
                  >
                    Origineel herstellen
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {customLogos[sponsorName] && (
                  <span className="text-[10px] text-blue-500 font-medium">Aangepast logo actief</span>
                )}
              </div>
            </div>
          </div>

          {/* Groups section */}
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Koepels (koepelpartner)</p>
            {Object.keys(eventGroups || {}).length === 0 ? (
              <p className="text-xs text-gray-400">Geen koepels gedefinieerd. Voeg koepels toe via het tandwiel-icoon.</p>
            ) : (
              <div className="space-y-2">
                {Object.keys(eventGroups).map(groupName => {
                  const sponsorGroupData = (sponsorGroups[sponsorName] || {})
                  const checked = groupName in sponsorGroupData
                  const cat = sponsorGroupData[groupName] || ''
                  const groupEvents = eventGroups[groupName] || []
                  return (
                    <div key={groupName} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${checked ? 'bg-teal-50' : 'bg-gray-50'}`}>
                      <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            const current = { ...(sponsorGroups[sponsorName] || {}) }
                            if (e.target.checked) current[groupName] = ''
                            else delete current[groupName]
                            onSponsorGroupsChange(current)
                          }}
                          className="w-4 h-4 accent-teal-600"
                        />
                        <div>
                          <span className={`text-xs font-bold ${checked ? 'text-teal-700' : 'text-gray-400'}`}>{groupName}</span>
                        </div>
                      </label>
                      <select
                        value={cat}
                        onChange={e => {
                          const current = { ...(sponsorGroups[sponsorName] || {}), [groupName]: e.target.value }
                          onSponsorGroupsChange(current)
                        }}
                        disabled={!checked}
                        className={`flex-1 text-xs px-2 py-1 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 transition-colors ${
                          checked ? 'border-teal-200 bg-white text-gray-700' : 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        <option value="">— categorie —</option>
                        {(groupCategories || []).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Events + categories */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Events & categorie</p>
            {events.length === 0 ? (
              <p className="text-xs text-gray-400">Geen events gedefinieerd. Voeg events toe via het tandwiel-icoon.</p>
            ) : (
              <div className="space-y-2">
                {events.map(ev => {
                  const checked = sponsorEvents.includes(ev)
                  const cat = (sponsorCategories[sponsorName] || {})[ev] || ''
                  return (
                    <div key={ev} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${checked ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => toggleEvent(ev, e.target.checked)}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className={`text-xs font-bold w-12 ${checked ? 'text-blue-700' : 'text-gray-400'}`}>{ev}</span>
                      </label>
                      <select
                        value={cat}
                        onChange={e => setCategory(ev, e.target.value)}
                        disabled={!checked}
                        className={`flex-1 text-xs px-2 py-1 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors ${
                          checked ? 'border-blue-200 bg-white text-gray-700' : 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        <option value="">— categorie —</option>
                        {categoryList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )
                })}
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-3">Sponsors zonder events zijn zichtbaar bij alle events.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-900 transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  )
}
