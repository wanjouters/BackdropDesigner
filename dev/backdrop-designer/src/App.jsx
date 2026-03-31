import { useState, useEffect, useRef } from 'react'
import './index.css'
import GridTypeSelector from './components/GridTypeSelector'
import GridCanvas from './components/GridCanvas'
import FrequencyPanel from './components/FrequencyPanel'
import CustomFormatModal from './components/CustomFormatModal'
import LogoLibrary from './components/LogoLibrary'
import SettingsModal from './components/SettingsModal'
import GridToolbar from './components/GridToolbar'
import PreviewCanvas from './components/PreviewCanvas'
import { exportJpeg } from './utils/exportJpeg'
import {
  loadCustomLogos, saveCustomLogos, loadSavedDesigns, saveDesignsList,
  loadDesignFolders, saveDesignFolders,
  loadTags, saveTags, loadEvents, saveEvents,
  loadSponsorCategories, saveSponsorCategories,
  loadCategoryList, saveCategoryList,
  loadEventGroups, saveEventGroups,
  loadSponsorGroups, saveSponsorGroups,
  loadCellPresets, saveCellPresets,
  loadDefaultAspect, saveDefaultAspect,
  saveDraft, loadDraft, clearDraft,
} from './utils/sponsorTags'

function makeEmptySlots(cols, rows) {
  return Array(cols * rows).fill('BLANK')
}

// Resize slots array when cols/rows change, preserving existing values where possible
function resizeSlots(oldSlots, oldCols, newCols, newRows) {
  const oldRows = oldCols > 0 ? Math.ceil(oldSlots.length / oldCols) : 0
  const next = []
  for (let r = 0; r < newRows; r++) {
    for (let c = 0; c < newCols; c++) {
      next.push(r < oldRows && c < oldCols ? (oldSlots[r * oldCols + c] || 'BLANK') : 'BLANK')
    }
  }
  return next
}

// Build tree from flat path list: [{ path, name, children }]
function buildFolderTree(folders) {
  const nodes = {}
  folders.forEach(path => { nodes[path] = { path, name: path.split('/').pop(), children: [] } })
  const roots = []
  folders.forEach(path => {
    const parts = path.split('/')
    if (parts.length === 1) { roots.push(nodes[path]); return }
    const parentPath = parts.slice(0, -1).join('/')
    if (nodes[parentPath]) nodes[parentPath].children.push(nodes[path])
    else roots.push(nodes[path]) // orphan — show as root
  })
  return roots
}

function DesignRow({ d, renamingDesign, folders, onLoad, onDelete, onRename, onStartRename, onMoveToFolder, indent = 0 }) {
  const [folderMenuOpen, setFolderMenuOpen] = useState(false)
  const inputRef = { current: null }

  return (
    <div className="hover:bg-gray-50 transition-colors group relative" style={{ paddingLeft: 12 + indent * 12 }}>
      <div className="px-3 py-2">
        {renamingDesign === d.id ? (
          <div className="flex items-center gap-1">
            <input
              ref={el => { inputRef.current = el }}
              autoFocus
              defaultValue={d.name}
              onKeyDown={e => {
                if (e.key === 'Enter') onRename(d.id, inputRef.current.value)
                if (e.key === 'Escape') onStartRename(null)
              }}
              className="flex-1 text-xs px-2 py-0.5 border border-blue-400 rounded focus:outline-none"
            />
            <button onMouseDown={e => { e.preventDefault(); onRename(d.id, inputRef.current.value) }} className="text-[10px] text-blue-600 font-semibold">OK</button>
            <button onMouseDown={() => onStartRename(null)} className="text-[10px] text-gray-400">✕</button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button onClick={() => onLoad(d)} className="flex-1 text-left min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{d.name}</p>
              <p className="text-[10px] text-gray-400">{d.formatCode} · {new Date(d.savedAt).toLocaleDateString('nl-BE')}</p>
            </button>
            {folders.length > 0 && (
              <div className="relative flex-shrink-0">
                <button onClick={() => setFolderMenuOpen(v => !v)} title="Verplaats naar map"
                  className="text-gray-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 3.5h4l1 1.5h5v5.5H1z"/>
                  </svg>
                </button>
                {folderMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1 min-w-[150px] max-h-48 overflow-y-auto">
                    {d.folder && (
                      <button onClick={() => { onMoveToFolder(d.id, null); setFolderMenuOpen(false) }}
                        className="w-full text-left text-xs px-3 py-1.5 text-gray-400 hover:bg-gray-50 italic">Geen map</button>
                    )}
                    {folders.filter(f => f !== d.folder).map(f => {
                      const depth = f.split('/').length - 1
                      const label = f.split('/').pop()
                      return (
                        <button key={f} onClick={() => { onMoveToFolder(d.id, f); setFolderMenuOpen(false) }}
                          className="w-full text-left text-xs py-1.5 text-gray-700 hover:bg-blue-50 hover:text-blue-700 truncate flex items-center gap-1"
                          style={{ paddingLeft: 12 + depth * 10, paddingRight: 12 }}
                        >
                          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-gray-400">
                            <path d="M1 3h3.5l1 1.5H11v5.5H1z"/>
                          </svg>
                          {label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            <button onClick={() => onStartRename(d.id)} title="Hernoemen"
              className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1l3 3-7 7H1V8l7-7z"/></svg>
            </button>
            <button onClick={() => onDelete(d.id)} title="Verwijderen"
              className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3h8M5 3V2h2v1M4 3v6h4V3"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function FolderNode({ node, depth, designs, folders, renamingDesign, collapsedFolders, renamingFolder, addingSubfolderFor,
  onLoad, onDelete, onRename, onStartRename, onMoveToFolder,
  onToggleFolder, onStartRenameFolder, onConfirmRenameFolder, onDeleteFolder,
  onStartAddSubfolder, onConfirmAddSubfolder, onCancelAddSubfolder, addSubfolderVal, setAddSubfolderVal,
}) {
  const folderRenameRef = { current: null }
  const isCollapsed = collapsedFolders[node.path]
  const isRenaming = renamingFolder === node.path
  const isAddingSub = addingSubfolderFor === node.path

  // Designs directly in this folder (not in subfolders)
  const inFolder = designs.filter(d => d.folder === node.path)
  // Count: designs in this folder + all descendant folders
  const allPaths = new Set([node.path, ...folders.filter(f => f.startsWith(node.path + '/'))])
  const totalCount = designs.filter(d => allPaths.has(d.folder)).length

  const indent = depth * 12
  const bgClass = depth === 0 ? 'bg-gray-50' : 'bg-gray-50/60'

  return (
    <div className="border-b border-gray-50 last:border-0">
      {/* Folder header */}
      <div className={`flex items-center gap-1 py-1.5 ${bgClass} group/folder`} style={{ paddingLeft: 12 + indent, paddingRight: 8 }}>
        <button onClick={() => onToggleFolder(node.path)} className="flex items-center gap-1 flex-1 min-w-0">
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
            style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}>
            <path d="M2 3.5l3 3 3-3"/>
          </svg>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className={depth === 0 ? 'text-blue-400' : 'text-blue-300'} style={{ flexShrink: 0 }}>
            <path d="M1 3h3.5l1 1.5H11v5.5H1z"/>
          </svg>
          {isRenaming ? (
            <input ref={el => { folderRenameRef.current = el }} autoFocus defaultValue={node.name}
              onClick={e => e.stopPropagation()}
              onKeyDown={e => {
                if (e.key === 'Enter') { onConfirmRenameFolder(node.path, folderRenameRef.current.value); }
                if (e.key === 'Escape') onStartRenameFolder(null)
              }}
              className="flex-1 text-xs px-1 py-0 border-b border-blue-400 bg-transparent focus:outline-none min-w-0"
            />
          ) : (
            <span className="text-xs font-semibold text-gray-600 truncate">{node.name}</span>
          )}
          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-0.5">({totalCount})</span>
        </button>
        {!isRenaming && (
          <>
            <button onClick={() => onStartAddSubfolder(node.path)} title="Submap toevoegen"
              className="text-gray-300 hover:text-blue-500 opacity-0 group-hover/folder:opacity-100 transition-opacity flex-shrink-0">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 1v10M1 6h10"/>
              </svg>
            </button>
            <button onClick={() => onStartRenameFolder(node.path)} title="Hernoemen"
              className="text-gray-300 hover:text-gray-500 opacity-0 group-hover/folder:opacity-100 transition-opacity flex-shrink-0">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1l3 3-7 7H1V8l7-7z"/></svg>
            </button>
            <button onClick={() => onDeleteFolder(node.path)} title="Map verwijderen"
              className="text-gray-300 hover:text-red-500 opacity-0 group-hover/folder:opacity-100 transition-opacity flex-shrink-0">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3h8M5 3V2h2v1M4 3v6h4V3"/></svg>
            </button>
          </>
        )}
      </div>

      {/* Contents */}
      {!isCollapsed && (
        <>
          {/* Add subfolder input */}
          {isAddingSub && (
            <div className="flex items-center gap-1 py-1.5 border-b border-gray-50" style={{ paddingLeft: 24 + indent, paddingRight: 8 }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300 flex-shrink-0">
                <path d="M1 3h3.5l1 1.5H11v5.5H1z"/>
              </svg>
              <input autoFocus type="text" value={addSubfolderVal} onChange={e => setAddSubfolderVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === '/') { e.preventDefault(); return }
                  if (e.key === 'Enter') onConfirmAddSubfolder(node.path)
                  if (e.key === 'Escape') onCancelAddSubfolder()
                }}
                placeholder="Submapnaam..."
                className="flex-1 text-xs px-1 py-0.5 border-b border-blue-400 bg-transparent focus:outline-none min-w-0"
              />
              <button onClick={() => onConfirmAddSubfolder(node.path)} className="text-[10px] text-blue-600 font-semibold">OK</button>
              <button onClick={onCancelAddSubfolder} className="text-[10px] text-gray-400">✕</button>
            </div>
          )}

          {/* Subfolders */}
          {node.children.map(child => (
            <FolderNode key={child.path} node={child} depth={depth + 1}
              designs={designs} folders={folders} renamingDesign={renamingDesign}
              collapsedFolders={collapsedFolders} renamingFolder={renamingFolder}
              addingSubfolderFor={addingSubfolderFor}
              onLoad={onLoad} onDelete={onDelete} onRename={onRename}
              onStartRename={onStartRename} onMoveToFolder={onMoveToFolder}
              onToggleFolder={onToggleFolder} onStartRenameFolder={onStartRenameFolder}
              onConfirmRenameFolder={onConfirmRenameFolder} onDeleteFolder={onDeleteFolder}
              onStartAddSubfolder={onStartAddSubfolder} onConfirmAddSubfolder={onConfirmAddSubfolder}
              onCancelAddSubfolder={onCancelAddSubfolder}
              addSubfolderVal={addSubfolderVal} setAddSubfolderVal={setAddSubfolderVal}
            />
          ))}

          {/* Designs in this folder */}
          {inFolder.length === 0 && node.children.length === 0 && !isAddingSub && (
            <p className="text-[10px] text-gray-300 italic py-1.5" style={{ paddingLeft: 28 + indent }}>Leeg</p>
          )}
          {inFolder.map(d => (
            <DesignRow key={d.id} d={d} renamingDesign={renamingDesign} folders={folders}
              onLoad={onLoad} onDelete={onDelete} onRename={onRename}
              onStartRename={onStartRename} onMoveToFolder={onMoveToFolder}
              indent={depth + 1}
            />
          ))}
        </>
      )}
    </div>
  )
}

function SavedDesignsPanel({ designs, folders, renamingDesign, onLoad, onDelete, onRename, onStartRename, onMoveToFolder, onAddFolder, onRenameFolder, onDeleteFolder }) {
  const [collapsed, setCollapsed] = useState(designs.length === 0 && folders.length === 0)
  const [collapsedFolders, setCollapsedFolders] = useState({})
  const [renamingFolder, setRenamingFolder] = useState(null)
  const [addingSubfolderFor, setAddingSubfolderFor] = useState(null) // folder path | 'root'
  const [addSubfolderVal, setAddSubfolderVal] = useState('')

  const tree = buildFolderTree(folders)
  const ungrouped = designs.filter(d => !d.folder)
  const total = designs.length

  function toggleFolder(path) {
    setCollapsedFolders(prev => ({ ...prev, [path]: !prev[path] }))
  }

  function handleConfirmRenameFolder(path, newName) {
    onRenameFolder(path, newName)
    setRenamingFolder(null)
  }

  function handleStartAddSubfolder(parentPath) {
    setAddingSubfolderFor(parentPath)
    setAddSubfolderVal('')
  }

  function handleConfirmAddSubfolder(parentPath) {
    if (addSubfolderVal.trim()) onAddFolder(addSubfolderVal.trim(), parentPath)
    setAddingSubfolderFor(null)
    setAddSubfolderVal('')
  }

  function handleCancelAddSubfolder() {
    setAddingSubfolderFor(null)
    setAddSubfolderVal('')
  }

  const sharedFolderNodeProps = {
    designs, folders, renamingDesign, collapsedFolders, renamingFolder,
    addingSubfolderFor,
    onLoad, onDelete, onRename, onStartRename, onMoveToFolder,
    onToggleFolder: toggleFolder,
    onStartRenameFolder: setRenamingFolder,
    onConfirmRenameFolder: handleConfirmRenameFolder,
    onDeleteFolder,
    onStartAddSubfolder: handleStartAddSubfolder,
    onConfirmAddSubfolder: handleConfirmAddSubfolder,
    onCancelAddSubfolder: handleCancelAddSubfolder,
    addSubfolderVal, setAddSubfolderVal,
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex-shrink-0">
      <button onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 1h8l2 2v9a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/>
            <path d="M9 1v4H4V1"/>
          </svg>
          Opgeslagen
          {total > 0 && <span className="text-xs text-gray-400 font-normal">({total})</span>}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
          <path d="M2 3.5l3 3 3-3"/>
        </svg>
      </button>

      {!collapsed && (
        <div className="border-t border-gray-100">
          {total === 0 && folders.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-3">Nog geen opgeslagen ontwerpen.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {/* Folder tree */}
              {tree.map(node => (
                <FolderNode key={node.path} node={node} depth={0} {...sharedFolderNodeProps} />
              ))}
              {/* Ungrouped designs */}
              {ungrouped.map(d => (
                <DesignRow key={d.id} d={d} renamingDesign={renamingDesign} folders={folders}
                  onLoad={onLoad} onDelete={onDelete} onRename={onRename}
                  onStartRename={onStartRename} onMoveToFolder={onMoveToFolder} indent={0} />
              ))}
            </div>
          )}

          {/* Add root folder */}
          <div className="border-t border-gray-100 px-3 py-2">
            {addingSubfolderFor === 'root' ? (
              <div className="flex items-center gap-1">
                <input autoFocus type="text" value={addSubfolderVal} onChange={e => setAddSubfolderVal(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === '/') { e.preventDefault(); return }
                    if (e.key === 'Enter') { if (addSubfolderVal.trim()) onAddFolder(addSubfolderVal.trim(), null); handleCancelAddSubfolder() }
                    if (e.key === 'Escape') handleCancelAddSubfolder()
                  }}
                  placeholder="Mapnaam..."
                  className="flex-1 text-xs px-2 py-0.5 border border-blue-400 rounded focus:outline-none"
                />
                <button onClick={() => { if (addSubfolderVal.trim()) onAddFolder(addSubfolderVal.trim(), null); handleCancelAddSubfolder() }}
                  className="text-[10px] text-blue-600 font-semibold">OK</button>
                <button onClick={handleCancelAddSubfolder} className="text-[10px] text-gray-400">✕</button>
              </div>
            ) : (
              <button onClick={() => { setAddingSubfolderFor('root'); setAddSubfolderVal('') }}
                className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-blue-600 transition-colors">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 1v10M1 6h10"/>
                </svg>
                Nieuwe map
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Toast notification ────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  const styles = {
    success: { bg: '#16a34a', icon: <path d="M2 7l4 4 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> },
    info:    { bg: '#2563eb', icon: <path d="M7 3v4M7 9v1" stroke="white" strokeWidth="2" strokeLinecap="round"/> },
    warning: { bg: '#d97706', icon: <path d="M7 3v4M7 9v1" stroke="white" strokeWidth="2" strokeLinecap="round"/> },
    error:   { bg: '#dc2626', icon: <path d="M3 3l8 8M11 3L3 11" stroke="white" strokeWidth="2" strokeLinecap="round"/> },
  }
  const s = styles[type] || styles.success

  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 400,
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 16px', borderRadius: 10,
      background: s.bg,
      color: 'white', fontSize: 13, fontWeight: 600,
      boxShadow: '0 4px 24px rgba(0,0,0,0.22)',
      pointerEvents: 'none',
      animation: 'toastIn 0.18s ease',
    }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">{s.icon}</svg>
      {message}
    </div>
  )
}

// ─── Export dropdown ─────────────────────────────────────────────────────────
function ExportMenu({ format, slots, customLogos, onImportJson }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const importRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function handleJpeg() {
    setOpen(false)
    exportJpeg(format, slots, customLogos)
  }

  function handleJson() {
    setOpen(false)
    var data = { version: 1, format: format, slots: slots, exportedAt: Date.now() }
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = (format.Code || 'ontwerp') + '_design.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    setOpen(false)
    if (importRef.current) importRef.current.click()
  }

  function handleImportFile(e) {
    var file = e.target.files[0]
    if (!file) return
    var reader = new FileReader()
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result)
        if (!data.format || !Array.isArray(data.slots)) throw new Error('Ongeldig formaat')
        onImportJson(data)
      } catch (err) {
        alert('Kon het bestand niet laden: ' + err.message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleCsv() {
    setOpen(false)
    const { Cols, Rows, Code } = format
    function csvCell(val) {
      var s = (val && val !== '') ? val : 'BLANK'
      if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }
    var colHeaders = Array.from({ length: Cols }, function(_, i) { return 'C' + (i + 1) })
    var lines = [colHeaders.join(',')]
    for (var r = 0; r < Rows; r++) {
      var row = []
      for (var c = 0; c < Cols; c++) row.push(csvCell(slots[r * Cols + c]))
      lines.push(row.join(','))
    }
    var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = (Code || 'grid') + '_grid.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Exporteren"
        className="flex items-center gap-1 bg-gray-700 hover:bg-gray-800 text-white font-semibold text-sm px-3 py-2.5 rounded-lg transition-colors shadow-sm"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 1v8M4 6l3 3 3-3M2 11h10"/>
        </svg>
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M2 3.5l3 3 3-3"/>
        </svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 50, minWidth: 160 }}
          className="bg-white border border-gray-200 rounded-xl shadow-xl py-1">
          <button onClick={handleJpeg}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="1" y="1" width="12" height="12" rx="2"/>
              <path d="M1 9l3-3 2 2 3-4 4 5"/>
            </svg>
            <span className="font-medium">JPEG</span>
            <span className="ml-auto text-xs text-gray-400">beeld</span>
          </button>
          <button onClick={handleCsv}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M2 1h7l3 3v9a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/>
              <path d="M9 1v3h3M4 8h6M4 11h4"/>
            </svg>
            <span className="font-medium">CSV</span>
            <span className="ml-auto text-xs text-gray-400">Gridzilla</span>
          </button>
          <button onClick={handleJson}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M2 1h7l3 3v9a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/>
              <path d="M9 1v3h3"/>
              <path d="M4 7.5c0-1 1.5-1 1.5 0s-1.5 1-1.5 2 1.5 1 1.5 0M8 7h1.5a1 1 0 010 2H8"/>
            </svg>
            <span className="font-medium">JSON</span>
            <span className="ml-auto text-xs text-gray-400">backup</span>
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button onClick={handleImportClick}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M7 10V2M4 5l3-3 3 3M2 11h10"/>
            </svg>
            <span className="font-medium">JSON laden</span>
            <span className="ml-auto text-xs text-gray-400">importeer</span>
          </button>
          <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
        </div>
      )}
    </div>
  )
}

// ─── Confirm modal ────────────────────────────────────────────────────────────
function ConfirmModal({ message, confirmLabel = 'Verwijderen', variant = 'danger', onConfirm, onCancel }) {
  const btnClass = variant === 'warning'
    ? 'bg-orange-500 hover:bg-orange-600 text-white'
    : 'bg-red-600 hover:bg-red-700 text-white'
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <p className="text-sm text-gray-700 mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel}
            className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors">
            Annuleren
          </button>
          <button onClick={() => { onConfirm(); onCancel() }}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${btnClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [selectedFormat, setSelectedFormat] = useState(null)
  const [editedFormat, setEditedFormat] = useState(null)
  const [slots, setSlots] = useState([])
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [selectedSlots, setSelectedSlots] = useState(new Set())
  const [view, setView] = useState('grid') // 'grid' | 'preview'
  const [customLogos, setCustomLogos] = useState(() => loadCustomLogos())
  const [savedDesigns, setSavedDesigns] = useState(() => loadSavedDesigns())
  const [designFolders, setDesignFolders] = useState(() => loadDesignFolders())
  const [saveNameInput, setSaveNameInput] = useState('')
  const [saveFolderInput, setSaveFolderInput] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [renamingDesign, setRenamingDesign] = useState(null)
  const [advanceDir, setAdvanceDirState] = useState(() => localStorage.getItem('backdropDesigner_advanceDir') || 'r')

  // Settings state (lifted from LogoLibrary)
  const [tags, setTags] = useState(() => loadTags())
  const [sponsorCategories, setSponsorCategories] = useState(() => loadSponsorCategories())
  const [events, setEvents] = useState(() => loadEvents())
  const [categoryList, setCategoryList] = useState(() => loadCategoryList())
  const [eventGroups, setEventGroups] = useState(() => loadEventGroups())
  const [sponsorGroups, setSponsorGroups] = useState(() => loadSponsorGroups())
  const [cellPresets, setCellPresets] = useState(() => loadCellPresets())
  const [defaultAspect, setDefaultAspectState] = useState(() => loadDefaultAspect())
  const [showSettings, setShowSettings] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)   // { message, onConfirm, confirmLabel, variant }
  const [draftRestoreData, setDraftRestoreData] = useState(null)
  const [toast, setToast] = useState(null)          // { message, type }
  const [isDirty, setIsDirty] = useState(false)
  const [loadedDesignId, setLoadedDesignId] = useState(null) // id of the currently loaded saved design
  const hasMounted = useRef(false)
  const skipNextDirtyMark = useRef(false)

  // ─── Confirm helper ───────────────────────────────────────────────────────
  function askConfirm(message, onConfirm, confirmLabel = 'Verwijderen', variant = 'danger') {
    setConfirmAction({ message, onConfirm, confirmLabel, variant })
  }

  // ─── Toast helper ─────────────────────────────────────────────────────────
  function showToast(message, type = 'success') {
    setToast({ message, type })
  }

  // ─── Auto-save draft + dirty tracking ────────────────────────────────────
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return }
    if (!editedFormat) return
    saveDraft({ format: editedFormat, slots, savedAt: Date.now() })
    if (skipNextDirtyMark.current) { skipNextDirtyMark.current = false; return }
    setIsDirty(true)
  }, [slots, editedFormat])

  // ─── Load draft on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const draft = loadDraft()
    if (draft && draft.format && Array.isArray(draft.slots)) setDraftRestoreData(draft)
  }, [])

  function setAdvanceDir(dir) {
    setAdvanceDirState(dir)
    localStorage.setItem('backdropDesigner_advanceDir', dir)
  }

  function handleImportJson(data) {
    const doImport = () => {
      skipNextDirtyMark.current = true
      setIsDirty(false)
      setLoadedDesignId(null)
      setEditedFormat({ ...data.format })
      setSelectedFormat({ ...data.format })
      setSlots([...data.slots])
      setSelectedSlots(new Set())
      clearDraft()
      showToast('Ontwerp geladen vanuit JSON', 'info')
    }
    const hasFilled = slots.some(s => s && s !== 'BLANK')
    if (hasFilled) {
      askConfirm('Huidig ontwerp vervangen door het geïmporteerde JSON-bestand?', doImport, 'Importeren', 'warning')
    } else {
      doImport()
    }
  }

  function handleBulkReplace(from, to) {
    setSlots(slots.map(s => s === from ? to : s))
    showToast(`Alle "${from}" vervangen door "${to}"`, 'success')
  }

  function handleCustomLogoChange(sponsorName, dataUrl) {
    const next = { ...customLogos }
    if (dataUrl) next[sponsorName] = dataUrl
    else delete next[sponsorName]
    setCustomLogos(next)
    saveCustomLogos(next)
  }

  function handleSaveDesign() {
    const name = saveNameInput.trim() || `${editedFormat?.Code || 'Ontwerp'} — ${new Date().toLocaleDateString('nl-BE')}`
    const design = {
      id: Date.now(),
      name,
      formatCode: editedFormat?.Code || '',
      format: { ...editedFormat },
      slots: [...slots],
      savedAt: Date.now(),
      folder: saveFolderInput || null,
    }
    const next = [design, ...savedDesigns]
    setSavedDesigns(next)
    saveDesignsList(next)
    setSaveNameInput('')
    setSaveFolderInput('')
    setShowSaveInput(false)
    clearDraft()
    setIsDirty(false)
    showToast('Ontwerp opgeslagen', 'success')
  }

  function handleUpdateDesign() {
    if (!loadedDesignId) return
    const next = savedDesigns.map(d =>
      d.id === loadedDesignId
        ? { ...d, format: { ...editedFormat }, slots: [...slots], savedAt: Date.now() }
        : d
    )
    setSavedDesigns(next)
    saveDesignsList(next)
    clearDraft()
    setIsDirty(false)
    const design = next.find(d => d.id === loadedDesignId)
    showToast(`"${design?.name || 'Ontwerp'}" bijgewerkt`, 'success')
  }

  function handleMoveToFolder(id, folderName) {
    const next = savedDesigns.map(d => d.id === id ? { ...d, folder: folderName || null } : d)
    setSavedDesigns(next)
    saveDesignsList(next)
  }

  function handleAddFolder(name, parentPath) {
    const val = name.trim()
    if (!val || val.includes('/')) return
    const fullPath = parentPath ? `${parentPath}/${val}` : val
    if (designFolders.includes(fullPath)) return
    const next = [...designFolders, fullPath]
    setDesignFolders(next)
    saveDesignFolders(next)
  }

  function handleRenameFolder(oldPath, newName) {
    const val = newName.trim()
    if (!val || val.includes('/')) return
    const parts = oldPath.split('/')
    parts[parts.length - 1] = val
    const newPath = parts.join('/')
    if (newPath === oldPath || designFolders.includes(newPath)) return
    const next = designFolders.map(f => {
      if (f === oldPath) return newPath
      if (f.startsWith(oldPath + '/')) return newPath + f.slice(oldPath.length)
      return f
    })
    setDesignFolders(next)
    saveDesignFolders(next)
    const updatedDesigns = savedDesigns.map(d => {
      if (!d.folder) return d
      if (d.folder === oldPath) return { ...d, folder: newPath }
      if (d.folder.startsWith(oldPath + '/')) return { ...d, folder: newPath + d.folder.slice(oldPath.length) }
      return d
    })
    setSavedDesigns(updatedDesigns)
    saveDesignsList(updatedDesigns)
  }

  function handleDeleteFolder(path) {
    const folderName = path.split('/').pop()
    const subCount = designFolders.filter(f => f.startsWith(path + '/')).length
    const designCount = savedDesigns.filter(d => d.folder === path || (d.folder && d.folder.startsWith(path + '/'))).length
    const parts = [
      subCount > 0 && `${subCount} submap${subCount > 1 ? 'pen' : ''}`,
      designCount > 0 && `${designCount} ontwerp${designCount > 1 ? 'en worden uit de map geplaatst' : ' wordt uit de map geplaatst'}`,
    ].filter(Boolean).join(' en ')
    const detail = parts ? ` ${parts}.` : ''
    askConfirm(`Map "${folderName}" verwijderen?${detail}`, () => {
      const toDelete = new Set(designFolders.filter(f => f === path || f.startsWith(path + '/')))
      const next = designFolders.filter(f => !toDelete.has(f))
      setDesignFolders(next)
      saveDesignFolders(next)
      const updatedDesigns = savedDesigns.map(d => toDelete.has(d.folder) ? { ...d, folder: null } : d)
      setSavedDesigns(updatedDesigns)
      saveDesignsList(updatedDesigns)
      showToast(`Map "${folderName}" verwijderd`, 'info')
    })
  }

  function handleLoadDesign(design) {
    skipNextDirtyMark.current = true
    setIsDirty(false)
    setLoadedDesignId(design.id)
    setEditedFormat({ ...design.format })
    setSelectedFormat({ ...design.format })
    setSlots([...design.slots])
    setSelectedSlots(new Set())
    clearDraft()
    showToast(`"${design.name}" geladen`, 'info')
  }

  function handleDeleteDesign(id) {
    const design = savedDesigns.find(d => d.id === id)
    const name = design ? `"${design.name}"` : 'dit ontwerp'
    askConfirm(`Ontwerp ${name} definitief verwijderen?`, () => {
      const next = savedDesigns.filter(d => d.id !== id)
      setSavedDesigns(next)
      saveDesignsList(next)
      if (loadedDesignId === id) setLoadedDesignId(null)
      showToast('Ontwerp verwijderd', 'info')
    })
  }

  function handleRenameDesign(id, newName) {
    const val = newName.trim()
    if (!val) return
    const next = savedDesigns.map(d => d.id === id ? { ...d, name: val } : d)
    setSavedDesigns(next)
    saveDesignsList(next)
    setRenamingDesign(null)
  }

  function handleSelectFormat(format) {
    const doSelect = () => {
      skipNextDirtyMark.current = true
      setIsDirty(false)
      setLoadedDesignId(null)
      setSelectedFormat(format)
      setEditedFormat({ ...format })
      setSlots(makeEmptySlots(format.Cols, format.Rows))
      setSelectedSlots(new Set())
      clearDraft()
    }
    const filled = slots.filter(s => s !== 'BLANK').length
    if (filled > 0) {
      askConfirm(
        `Het huidige ontwerp heeft ${filled} ingevulde slot${filled > 1 ? 's' : ''}. Bij het wisselen van formaat gaan deze verloren. Doorgaan?`,
        doSelect, 'Doorgaan', 'warning'
      )
    } else {
      doSelect()
    }
  }

  function handleCustomFormat(format) {
    setShowCustomModal(false)
    handleSelectFormat(format)
  }

  function handleFormatChange(updated) {
    const prevCols = editedFormat.Cols
    const prevRows = editedFormat.Rows
    setEditedFormat(updated)
    if (updated.Cols !== prevCols || updated.Rows !== prevRows) {
      setSlots(prev => resizeSlots(prev, prevCols, updated.Cols, updated.Rows))
      setSelectedSlots(new Set())
    }
  }

  // ─── Tags & categories (for SponsorEditModal in LogoLibrary) ─────────────
  function handleTagsChange(sponsorName, eventsArray) {
    const newTags = { ...tags, [sponsorName]: eventsArray }
    setTags(newTags); saveTags(newTags)
  }

  function handleCategoryChange(sponsorName, event, category) {
    const catCopy = { ...sponsorCategories, [sponsorName]: { ...(sponsorCategories[sponsorName] || {}), [event]: category } }
    if (category === '') delete catCopy[sponsorName][event]
    setSponsorCategories(catCopy); saveSponsorCategories(catCopy)
  }

  function handleSponsorGroupsChange(sponsorName, groupData) {
    const next = { ...sponsorGroups, [sponsorName]: groupData }
    setSponsorGroups(next); saveSponsorGroups(next)
  }

  // ─── Events ──────────────────────────────────────────────────────────────
  function addEvent(val) {
    const v = val.trim().toUpperCase()
    if (!v || events.includes(v)) return
    const next = [...events, v]; setEvents(next); saveEvents(next)
  }

  function deleteEvent(ev) {
    askConfirm(`Event "${ev}" verwijderen? Alle sponsortags voor dit event gaan verloren.`, () => {
      const next = events.filter(e => e !== ev); setEvents(next); saveEvents(next)
      const newTags = {}
      Object.entries(tags).forEach(([name, evs]) => { newTags[name] = evs.filter(e => e !== ev) })
      setTags(newTags); saveTags(newTags)
      const catCopy = {}
      Object.entries(sponsorCategories).forEach(([name, evMap]) => {
        catCopy[name] = { ...evMap }; delete catCopy[name][ev]
      })
      setSponsorCategories(catCopy); saveSponsorCategories(catCopy)
    })
  }

  function renameEvent(oldName, newName) {
    const val = newName.trim().toUpperCase()
    if (!val || val === oldName || events.includes(val)) return
    const next = events.map(e => e === oldName ? val : e); setEvents(next); saveEvents(next)
    const newTags = {}
    Object.entries(tags).forEach(([name, evs]) => { newTags[name] = evs.map(e => e === oldName ? val : e) })
    setTags(newTags); saveTags(newTags)
    const catCopy = {}
    Object.entries(sponsorCategories).forEach(([name, evMap]) => {
      catCopy[name] = {}
      Object.entries(evMap).forEach(([ev, cat]) => { catCopy[name][ev === oldName ? val : ev] = cat })
    })
    setSponsorCategories(catCopy); saveSponsorCategories(catCopy)
  }

  // ─── Categories ──────────────────────────────────────────────────────────
  function addCategory(val) {
    if (!val || categoryList.includes(val)) return
    const next = [...categoryList, val]; setCategoryList(next); saveCategoryList(next)
  }

  function deleteCategory(cat) {
    askConfirm(`Categorie "${cat}" verwijderen? Alle sponsortoewijzingen voor deze categorie gaan verloren.`, () => {
      const next = categoryList.filter(c => c !== cat); setCategoryList(next); saveCategoryList(next)
      const catCopy = {}
      Object.entries(sponsorCategories).forEach(([name, evMap]) => {
        catCopy[name] = {}
        Object.entries(evMap).forEach(([ev, c]) => { if (c !== cat) catCopy[name][ev] = c })
      })
      setSponsorCategories(catCopy); saveSponsorCategories(catCopy)
    })
  }

  function renameCategory(oldCat, newCat) {
    const val = newCat.trim()
    if (!val || val === oldCat || categoryList.includes(val)) return
    const next = categoryList.map(c => c === oldCat ? val : c); setCategoryList(next); saveCategoryList(next)
    const catCopy = {}
    Object.entries(sponsorCategories).forEach(([name, evMap]) => {
      catCopy[name] = {}
      Object.entries(evMap).forEach(([ev, c]) => { catCopy[name][ev] = c === oldCat ? val : c })
    })
    setSponsorCategories(catCopy); saveSponsorCategories(catCopy)
  }

  function reorderCategoryList(newOrder) {
    setCategoryList(newOrder); saveCategoryList(newOrder)
  }

  // ─── Event groups (koepels) ───────────────────────────────────────────────
  function addEventGroup(name) {
    const v = name.trim()
    if (!v || v in eventGroups) return
    const next = { ...eventGroups, [v]: [] }; setEventGroups(next); saveEventGroups(next)
  }

  function deleteEventGroup(name) {
    askConfirm(`Koepel "${name}" verwijderen?`, () => {
      const next = { ...eventGroups }; delete next[name]
      setEventGroups(next); saveEventGroups(next)
      const sg = {}
      Object.entries(sponsorGroups).forEach(([sp, groups]) => { const g = { ...groups }; delete g[name]; sg[sp] = g })
      setSponsorGroups(sg); saveSponsorGroups(sg)
    })
  }

  function renameEventGroup(oldName, newName) {
    const val = newName.trim()
    if (!val || val === oldName || val in eventGroups) return
    const next = {}
    Object.entries(eventGroups).forEach(([k, v]) => { next[k === oldName ? val : k] = v })
    setEventGroups(next); saveEventGroups(next)
    const sg = {}
    Object.entries(sponsorGroups).forEach(([sp, groups]) => {
      const g = {}
      Object.entries(groups).forEach(([k, v]) => { g[k === oldName ? val : k] = v })
      sg[sp] = g
    })
    setSponsorGroups(sg); saveSponsorGroups(sg)
  }

  function setEventKoepelAssign(eventCode, koepelName) {
    const next = {}
    Object.entries(eventGroups).forEach(([grp, evs]) => { next[grp] = evs.filter(e => e !== eventCode) })
    if (koepelName && koepelName in next) next[koepelName] = [...next[koepelName], eventCode]
    setEventGroups(next); saveEventGroups(next)
  }

  // ─── Cell presets ─────────────────────────────────────────────────────────
  function handleCellPresetsChange(newPresets) {
    setCellPresets(newPresets); saveCellPresets(newPresets)
  }

  // ─── Default aspect ratio ─────────────────────────────────────────────────
  function handleDefaultAspectChange(val) {
    const v = parseFloat(val) || 1.667
    setDefaultAspectState(v)
    saveDefaultAspect(v)
    // Apply immediately to the currently loaded format
    if (editedFormat) {
      const newH = Math.round((editedFormat.CellW_mm || 0) / v * 1000) / 1000
      handleFormatChange({ ...editedFormat, CellAspect: v, CellH_mm: newH })
    }
  }

  function handleClearGrid() {
    if (!editedFormat) return
    const filled = slots.filter(s => s !== 'BLANK').length
    if (filled === 0) return
    askConfirm(
      `Alle ${filled} ingevulde slot${filled > 1 ? 's' : ''} wissen?`,
      () => { setSlots(makeEmptySlots(editedFormat.Cols, editedFormat.Rows)); setSelectedSlots(new Set()); showToast('Grid gewist', 'info') },
      'Wissen'
    )
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key !== 'Backspace' && e.key !== 'Delete') return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if (selectedSlots.size === 0) return
      e.preventDefault()
      const next = [...slots]
      selectedSlots.forEach(i => { next[i] = 'BLANK' })
      setSlots(next)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedSlots, slots])

  function handleSelectSlot(index, shiftKey) {
    setSelectedSlots(prev => {
      const next = new Set(prev)
      if (shiftKey) {
        if (next.has(index)) next.delete(index)
        else next.add(index)
      } else {
        if (next.size === 1 && next.has(index)) next.clear()
        else { next.clear(); next.add(index) }
      }
      return next
    })
  }

  function handleDropOnSlot(slotIndex, sponsorName) {
    const next = [...slots]
    if (selectedSlots.has(slotIndex) && selectedSlots.size > 1) {
      selectedSlots.forEach(i => { next[i] = sponsorName })
    } else {
      next[slotIndex] = sponsorName
    }
    setSlots(next)
  }

  function handleAssignFromLibrary(sponsorName) {
    if (selectedSlots.size === 0) return
    const next = [...slots]
    selectedSlots.forEach(i => { next[i] = sponsorName })
    setSlots(next)
    if (selectedSlots.size === 1 && advanceDir !== 'none' && format) {
      const cols = format.Cols
      const total = slots.length
      const current = [...selectedSlots][0]
      const row = Math.floor(current / cols)
      const col = current % cols
      const rows = Math.ceil(total / cols)
      const dMap = {
        r:  [0, 1], l:  [0, -1], d:  [1, 0],  u:  [-1, 0],
        dr: [1, 1], dl: [1, -1], ur: [-1, 1], ul: [-1, -1],
      }
      const [dr, dc] = dMap[advanceDir] || [0, 0]
      const nr = row + dr, nc = col + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        const nextIndex = nr * cols + nc
        if (nextIndex >= 0 && nextIndex < total) setSelectedSlots(new Set([nextIndex]))
      }
    }
  }

  const selectionCount = selectedSlots.size
  const format = editedFormat

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      {/* Confirm modal */}
      {confirmAction && (
        <ConfirmModal
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          variant={confirmAction.variant}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Draft restore banner */}
      {draftRestoreData && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-amber-500 flex-shrink-0">
              <path d="M7 1v6l3 2"/><circle cx="7" cy="7" r="6"/>
            </svg>
            <span className="text-xs text-amber-700">
              Niet-opgeslagen werkstand gevonden van {new Date(draftRestoreData.savedAt).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}. Wil je verdergaan?
            </span>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <button
              onClick={() => {
                setEditedFormat({ ...draftRestoreData.format })
                setSelectedFormat({ ...draftRestoreData.format })
                setSlots([...draftRestoreData.slots])
                setSelectedSlots(new Set())
                setDraftRestoreData(null)
              }}
              className="text-xs px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors">
              Herstellen
            </button>
            <button
              onClick={() => { clearDraft(); setDraftRestoreData(null) }}
              className="text-xs px-2 py-1 text-amber-600 hover:text-amber-800 transition-colors">
              Negeren
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
              <rect x="1" y="1" width="5" height="5" rx="1"/>
              <rect x="8" y="1" width="5" height="5" rx="1"/>
              <rect x="1" y="8" width="5" height="5" rx="1"/>
              <rect x="8" y="8" width="5" height="5" rx="1"/>
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-none">BackdropDesigner</h1>
            <p className="text-xs text-gray-400 mt-0.5">Flanders Classics</p>
          </div>
        </div>

        {format && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                <p className="text-sm font-semibold text-gray-800">{format.Code}</p>
                {isDirty && (
                  <span title="Niet-opgeslagen wijzigingen" className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-400">
                {format.Cols}×{format.Rows} = {format.Cols * format.Rows} slots
                {selectionCount > 0 && (
                  <span className="ml-2 text-blue-500">
                    · {selectionCount} {selectionCount === 1 ? 'slot' : 'slots'} geselecteerd
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              title="Instellingen"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="9" r="3"/>
                <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4"/>
              </svg>
            </button>
            {showSaveInput ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  type="text"
                  value={saveNameInput}
                  onChange={e => setSaveNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveDesign(); if (e.key === 'Escape') setShowSaveInput(false) }}
                  placeholder={`${editedFormat?.Code || 'Ontwerp'} — ${new Date().toLocaleDateString('nl-BE')}`}
                  className="text-xs px-2.5 py-1.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-52"
                />
                {designFolders.length > 0 && (
                  <select
                    value={saveFolderInput}
                    onChange={e => setSaveFolderInput(e.target.value)}
                    className="text-xs px-2 py-1.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="">Geen map</option>
                    {designFolders.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                )}
                <button onClick={handleSaveDesign} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">Opslaan</button>
                <button onClick={() => setShowSaveInput(false)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {loadedDesignId && isDirty && (
                  <button
                    onClick={handleUpdateDesign}
                    title={`Bestaand ontwerp overschrijven`}
                    className="flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1.5 font-semibold transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 1h7l2 2v8a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/>
                      <path d="M8 1v4H4V1M4 7h4"/>
                    </svg>
                    Bijwerken
                  </button>
                )}
                <button
                  onClick={() => setShowSaveInput(true)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-blue-300 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 1h7l2 2v8a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/>
                    <path d="M8 1v4H4V1M4 7h4"/>
                  </svg>
                  {loadedDesignId ? 'Kopie opslaan' : 'Opslaan'}
                </button>
              </div>
            )}
            <button
              onClick={handleClearGrid}
              className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-red-300 transition-colors"
            >
              Wissen
            </button>
            <ExportMenu format={format} slots={slots} customLogos={customLogos} onImportJson={handleImportJson} />
          </div>
        )}
      </header>

      {/* Main layout — 3 columns */}
      <div className="flex gap-4 p-4 flex-1 overflow-hidden min-h-0">

        {/* Left sidebar */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">

          {/* Saved designs panel */}
          <SavedDesignsPanel
            designs={savedDesigns}
            folders={designFolders}
            renamingDesign={renamingDesign}
            onLoad={handleLoadDesign}
            onDelete={handleDeleteDesign}
            onRename={handleRenameDesign}
            onStartRename={setRenamingDesign}
            onMoveToFolder={handleMoveToFolder}
            onAddFolder={handleAddFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
          />

          <GridTypeSelector
            selected={selectedFormat}
            onSelect={handleSelectFormat}
            onCustom={() => setShowCustomModal(true)}
          />
          {format && (
            <>
              <FrequencyPanel slots={slots} onBulkReplace={handleBulkReplace} />
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Formaat info
                </h2>
                <dl className="space-y-1">
                  {[
                    ['Categorie', format.Categorie],
                    ['Event', format.EventStyle],
                    format.Variant && ['Variant', format.Variant],
                    format.CanvasWidth_mm && ['Canvas', `${format.CanvasWidth_mm} × ${format.CanvasHeight_mm} mm`],
                  ].filter(Boolean).map(([label, value]) => value && (
                    <div key={label} className="flex justify-between text-xs">
                      <dt className="text-gray-400">{label}</dt>
                      <dd className="text-gray-700 font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </>
          )}
        </div>

        {/* Center — toolbar + grid/preview */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden min-w-0">

          {format && (
            <>
              {/* View toggle + toolbar row */}
              <div className="flex items-start gap-3">
                {/* View toggle */}
                <div className="flex-shrink-0 bg-white border border-gray-200 rounded-xl p-1 flex gap-1">
                  <button
                    onClick={() => setView('grid')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      view === 'grid'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <rect x="0" y="0" width="5" height="5" rx="1"/>
                      <rect x="7" y="0" width="5" height="5" rx="1"/>
                      <rect x="0" y="7" width="5" height="5" rx="1"/>
                      <rect x="7" y="7" width="5" height="5" rx="1"/>
                    </svg>
                    Grid
                  </button>
                  <button
                    onClick={() => setView('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      view === 'preview'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="1" y="2" width="10" height="8" rx="1.5"/>
                      <path d="M4 6c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/>
                    </svg>
                    Preview
                  </button>
                </div>

                {/* Toolbar */}
                <div className="flex-1 min-w-0">
                  <GridToolbar format={format} onChange={handleFormatChange} cellPresets={cellPresets} />
                </div>
              </div>
            </>
          )}

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {!format ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#9ca3af" strokeWidth="2">
                      <rect x="2" y="2" width="10" height="10" rx="2"/>
                      <rect x="16" y="2" width="10" height="10" rx="2"/>
                      <rect x="2" y="16" width="10" height="10" rx="2"/>
                      <rect x="16" y="16" width="10" height="10" rx="2"/>
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">Selecteer een backdrop-formaat links</p>
                  <p className="text-gray-300 text-xs mt-1">of maak een nieuw formaat aan</p>
                </div>
              </div>
            ) : view === 'grid' ? (
              <div
                className="flex-1 overflow-auto bg-white rounded-xl border border-gray-200 p-4"
                onClick={e => { if (e.target === e.currentTarget) setSelectedSlots(new Set()) }}
              >
                <GridCanvas
                  format={format}
                  slots={slots}
                  onSlotsChange={setSlots}
                  selectedSlots={selectedSlots}
                  onSelectSlot={handleSelectSlot}
                  onDropSponsor={handleDropOnSlot}
                />
              </div>
            ) : (
              <PreviewCanvas
                format={format}
                slots={slots}
                selectedSlots={selectedSlots}
                onSelectSlot={handleSelectSlot}
                onDropSponsor={handleDropOnSlot}
                customLogos={customLogos}
              />
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-56 flex-shrink-0 flex flex-col min-h-0">
          <LogoLibrary
            selectedSlots={selectedSlots}
            onAssign={handleAssignFromLibrary}
            customLogos={customLogos}
            onCustomLogoChange={handleCustomLogoChange}
            advanceDir={advanceDir}
            onAdvanceDirChange={setAdvanceDir}
            onOpenSettings={() => setShowSettings(true)}
            tags={tags}
            sponsorCategories={sponsorCategories}
            events={events}
            categoryList={categoryList}
            eventGroups={eventGroups}
            sponsorGroups={sponsorGroups}
            onTagsChange={handleTagsChange}
            onCategoryChange={handleCategoryChange}
            onSponsorGroupsChange={handleSponsorGroupsChange}
          />
        </div>

      </div>

      {showCustomModal && (
        <CustomFormatModal
          onConfirm={handleCustomFormat}
          onClose={() => setShowCustomModal(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          cellPresets={cellPresets}
          onCellPresetsChange={handleCellPresetsChange}
          defaultAspect={defaultAspect}
          onDefaultAspectChange={handleDefaultAspectChange}
          events={events}
          onAddEvent={addEvent}
          onDeleteEvent={deleteEvent}
          onRenameEvent={renameEvent}
          eventGroups={eventGroups}
          onAddEventGroup={addEventGroup}
          onDeleteEventGroup={deleteEventGroup}
          onRenameEventGroup={renameEventGroup}
          onSetEventKoepel={setEventKoepelAssign}
          categoryList={categoryList}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
          onRenameCategory={renameCategory}
          onReorderCategoryList={reorderCategoryList}
        />
      )}
    </div>
  )
}
