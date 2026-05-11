import { useState, useMemo } from 'react'
import DesignRow from './DesignRow'

export default function SavedDesignsPanel({ designs, events, loadedDesignId, onLoad, onDelete, onEditMeta, onDuplicate }) {
  var [query, setQuery] = useState('')
  var [collapsedEvents, setCollapsedEvents] = useState({})
  var [collapsedEditions, setCollapsedEditions] = useState({})

  var filtered = useMemo(function() {
    if (!query.trim()) return designs
    var q = query.toLowerCase()
    return designs.filter(function(d) {
      return (d.name || '').toLowerCase().includes(q) ||
        (d.event || '').toLowerCase().includes(q) ||
        String(d.edition || '').includes(q)
    })
  }, [designs, query])

  var grouped = useMemo(function() {
    var eventMap = {}
    var noEvent = []
    filtered.forEach(function(d) {
      if (!d.event) { noEvent.push(d); return }
      if (!eventMap[d.event]) eventMap[d.event] = {}
      var year = d.edition !== null && d.edition !== undefined ? String(d.edition) : '__none__'
      if (!eventMap[d.event][year]) eventMap[d.event][year] = []
      eventMap[d.event][year].push(d)
    })
    var eventOrder = {}
    events.forEach(function(ev, i) { eventOrder[ev] = i })
    var sortedEventKeys = Object.keys(eventMap).sort(function(a, b) {
      var ai = eventOrder[a] !== undefined ? eventOrder[a] : 999
      var bi = eventOrder[b] !== undefined ? eventOrder[b] : 999
      if (ai !== bi) return ai - bi
      return a.localeCompare(b)
    })
    var result = sortedEventKeys.map(function(ev) {
      return {
        event: ev,
        editions: Object.keys(eventMap[ev]).sort(function(a, b) {
          if (a === '__none__') return 1
          if (b === '__none__') return -1
          return parseInt(b, 10) - parseInt(a, 10)
        }).map(function(year) {
          return {
            year: year === '__none__' ? null : year,
            designs: eventMap[ev][year].slice().sort(function(a, b) { return (b.savedAt || 0) - (a.savedAt || 0) })
          }
        })
      }
    })
    if (noEvent.length > 0) {
      result.push({
        event: null,
        editions: [{ year: null, designs: noEvent.slice().sort(function(a, b) { return (b.savedAt || 0) - (a.savedAt || 0) }) }]
      })
    }
    return result
  }, [filtered, events])

  function toggleEvent(evKey) {
    setCollapsedEvents(function(prev) { var n = Object.assign({}, prev); n[evKey] = !n[evKey]; return n })
  }
  function toggleEdition(evKey, yearKey) {
    var k = evKey + '__' + yearKey
    setCollapsedEditions(function(prev) { var n = Object.assign({}, prev); n[k] = !n[k]; return n })
  }
  function isEventCollapsed(evKey) { return !!collapsedEvents[evKey] }
  function isEditionCollapsed(evKey, yearKey) { return !!collapsedEditions[evKey + '__' + yearKey] }

  if (designs.length === 0 && !query) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
          <path d="M6 3h14l6 6v20a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z"/>
          <path d="M20 3v8h8M12 17h8M12 22h5"/>
        </svg>
        <p className="text-xs text-gray-400">Nog geen opgeslagen ontwerpen.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-2 flex-shrink-0">
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Zoek ontwerp..."
          className="w-full text-sm px-3 py-1.5 pr-7 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l8 8M10 2L2 10"/></svg>
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {grouped.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4 italic">Geen resultaten.</p>
        )}
        {grouped.map(function(group) {
          var evKey = group.event || '__none__'
          var totalCount = group.editions.reduce(function(n, e) { return n + e.designs.length }, 0)
          return (
            <div key={evKey} className="mb-1">
              <button onClick={() => toggleEvent(evKey)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  style={{ transform: isEventCollapsed(evKey) ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}>
                  <path d="M2 3.5l3 3 3-3"/>
                </svg>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide truncate flex-1">
                  {group.event || 'Overig'}
                </span>
                {!group.event && (
                  <span className="text-[9px] text-gray-300 mr-1 flex-shrink-0" title="Sla op met een event en editie om te groeperen">zonder event</span>
                )}
                <span className="text-[10px] text-gray-400 flex-shrink-0">({totalCount})</span>
              </button>
              {!isEventCollapsed(evKey) && group.editions.map(function(editionGroup) {
                var yearKey = editionGroup.year !== null ? String(editionGroup.year) : '__none__'
                var showEditionHeader = editionGroup.year !== null || group.editions.length > 1
                return (
                  <div key={yearKey} className="ml-3">
                    {showEditionHeader && (
                      <button onClick={() => toggleEdition(evKey, yearKey)}
                        className="w-full flex items-center gap-1.5 px-2 py-1 text-left hover:bg-gray-50 rounded transition-colors">
                        <svg width="7" height="7" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                          style={{ transform: isEditionCollapsed(evKey, yearKey) ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}>
                          <path d="M2 3.5l3 3 3-3"/>
                        </svg>
                        <span className="text-[11px] font-semibold text-gray-500">{editionGroup.year || 'Geen editie'}</span>
                        <span className="text-[10px] text-gray-300 ml-auto">({editionGroup.designs.length})</span>
                      </button>
                    )}
                    {!isEditionCollapsed(evKey, yearKey) && editionGroup.designs.map(function(d) {
                      return (
                        <DesignRow key={d.id} d={d} isLoaded={loadedDesignId === d.id}
                          onLoad={onLoad} onDelete={onDelete} onEditMeta={onEditMeta} onDuplicate={onDuplicate}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
